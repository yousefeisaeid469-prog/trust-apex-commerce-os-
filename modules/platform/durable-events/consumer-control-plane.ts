import { query, withPgTransaction } from '../db/postgres.ts';
import { listConsumerDefinitions } from '../commerce-events/contracts.ts';

export type ConsumerHealthState = 'HEALTHY'|'DEGRADED'|'UNAVAILABLE';
export type ConsumerHealth = {
  consumerId:string;
  state:ConsumerHealthState;
  pending:number;
  processing:number;
  retrying:number;
  deadLettered:number;
  oldestPendingAt:string|null;
  oldestProcessingAt:string|null;
  heartbeatAt:string|null;
  heartbeatStale:boolean;
  lastSuccessAt:string|null;
  retryRate5m:number;
  deadLetterRate5m:number;
};

const STALE_HEARTBEAT_MS = Math.max(30_000, Number(process.env.TRUST_CONSUMER_HEARTBEAT_STALE_MS ?? 120_000));
const STALE_DELIVERY_MS = Math.max(120_000, Number(process.env.TRUST_CONSUMER_STALE_DELIVERY_MS ?? 120_000));

function iso(value:unknown):string|null { return value ? new Date(String(value)).toISOString() : null; }

export async function getConsumerHealth():Promise<ConsumerHealth[]> {
  const consumers = listConsumerDefinitions();
  const result = await query<any>(
    `WITH defs AS (SELECT unnest($1::text[]) AS consumer_id)
     SELECT d.consumer_id,
       count(*) FILTER (WHERE ed.status='PENDING')::int AS pending,
       count(*) FILTER (WHERE ed.status='PROCESSING')::int AS processing,
       count(*) FILTER (WHERE ed.status='RETRYING')::int AS retrying,
       count(*) FILTER (WHERE ed.status='DEAD_LETTERED')::int AS dead_lettered,
       min(ed.created_at) FILTER (WHERE ed.status='PENDING') AS oldest_pending_at,
       min(ed.locked_at) FILTER (WHERE ed.status='PROCESSING') AS oldest_processing_at,
       h.updated_at AS heartbeat_at,
       h.last_success_at,
       h.last_error,
       COALESCE((SELECT count(*) FROM trust_event_consumer_failures f WHERE f.consumer_id=d.consumer_id AND f.last_seen_at >= now()-interval '5 minutes'),0)::int AS retry_rate_5m,
       COALESCE((SELECT count(*) FROM trust_event_dead_letters dl WHERE dl.consumer_id=d.consumer_id AND dl.created_at >= now()-interval '5 minutes'),0)::int AS dead_letter_rate_5m
     FROM defs d
     LEFT JOIN trust_event_deliveries ed ON ed.consumer_id=d.consumer_id
     LEFT JOIN trust_commerce_consumer_heartbeat h ON h.consumer_id=d.consumer_id
     GROUP BY d.consumer_id,h.updated_at,h.last_success_at,h.last_error
     ORDER BY d.consumer_id`,
    [consumers.map(x=>x.id)],
  );
  return result.rows.map(r=>{
    const heartbeatStale = !r.heartbeat_at || Date.now()-new Date(r.heartbeat_at).getTime() > STALE_HEARTBEAT_MS;
    const state:ConsumerHealthState = Number(r.dead_lettered)>0 || Number(r.processing)>0 && (!r.heartbeat_at || heartbeatStale) || Number(r.retry_rate_5m)>50 ? 'DEGRADED' : 'HEALTHY';
    return {consumerId:r.consumer_id,state,pending:Number(r.pending||0),processing:Number(r.processing||0),retrying:Number(r.retrying||0),deadLettered:Number(r.dead_lettered||0),oldestPendingAt:iso(r.oldest_pending_at),oldestProcessingAt:iso(r.oldest_processing_at),heartbeatAt:iso(r.heartbeat_at),heartbeatStale,lastSuccessAt:iso(r.last_success_at),retryRate5m:Number(r.retry_rate_5m||0),deadLetterRate5m:Number(r.dead_letter_rate_5m||0)};
  });
}

export async function captureConsumerHealthSnapshots() {
  const health = await getConsumerHealth();
  for (const h of health) {
    await query(`INSERT INTO trust_commerce_consumer_health_snapshots(consumer_id,state,pending_count,processing_count,retrying_count,dead_letter_count,oldest_pending_at,oldest_processing_at,last_success_at,heartbeat_at,heartbeat_stale,retry_rate_5m,dead_letter_rate_5m) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [h.consumerId,h.state,h.pending,h.processing,h.retrying,h.deadLettered,h.oldestPendingAt,h.oldestProcessingAt,h.lastSuccessAt,h.heartbeatAt,h.heartbeatStale,h.retryRate5m,h.deadLetterRate5m]);
  }
  return health;
}

export async function recoverStaleConsumerDeliveries(consumerId?:string) {
  return withPgTransaction(async client => {
    const result = await client.query<any>(
      `WITH stale AS (
         SELECT d.tenant_id,d.event_id,d.consumer_id,d.attempts AS delivery_attempts,d.reason,s.max_attempts,e.event_type,e.payload
           FROM trust_event_deliveries d
           LEFT JOIN trust_consumer_subscriptions s ON s.consumer_id=d.consumer_id AND s.event_type=(SELECT event_type FROM trust_commerce_events e2 WHERE e2.tenant_id=d.tenant_id AND e2.event_id=d.event_id)
           JOIN trust_commerce_events e ON e.tenant_id=d.tenant_id AND e.event_id=d.event_id
          WHERE d.status='PROCESSING' AND d.locked_at < now() - make_interval(secs => $1)
            AND ($2::text IS NULL OR d.consumer_id=$2)
          ORDER BY d.locked_at ASC
          FOR UPDATE OF d SKIP LOCKED
          LIMIT 500
       ), changed AS (
         UPDATE trust_event_deliveries d SET
           status=CASE WHEN s.delivery_attempts >= COALESCE(s.max_attempts,8) THEN 'DEAD_LETTERED' ELSE 'RETRYING' END,
           locked_at=NULL,locked_by=NULL,
           reason=CASE WHEN s.delivery_attempts >= COALESCE(s.max_attempts,8) THEN 'STALE_LEASE_MAX_ATTEMPTS' ELSE 'STALE_LEASE_RECLAIMED' END,
           next_attempt_at=CASE WHEN s.delivery_attempts >= COALESCE(s.max_attempts,8) THEN now() ELSE now() END
         FROM stale s WHERE d.tenant_id=s.tenant_id AND d.event_id=s.event_id AND d.consumer_id=s.consumer_id
         RETURNING d.tenant_id,d.event_id,d.consumer_id,d.status,d.reason
       )
       SELECT * FROM changed`,
      [STALE_DELIVERY_MS/1000, consumerId ?? null],
    );
    for (const row of result.rows) {
      const action = row.status==='DEAD_LETTERED' ? 'DEAD_LETTER_STALE' : 'RECLAIM_PROCESSING';
      const key = `v368:${action}:${row.tenant_id}:${row.event_id}:${row.consumer_id}`;
      await client.query(`INSERT INTO trust_commerce_consumer_recovery_actions(action_key,consumer_id,tenant_id,event_id,action,result,reason) VALUES($1,$2,$3,$4,$5,'APPLIED',$6) ON CONFLICT(action_key) DO NOTHING`, [key,row.consumer_id,row.tenant_id,row.event_id,action,row.reason]);
      if (row.status==='DEAD_LETTERED') {
        await client.query(`INSERT INTO trust_event_dead_letters(tenant_id,event_id,consumer_id,reason,payload) SELECT $1,$2,$3,$4,e.payload FROM trust_commerce_events e WHERE e.tenant_id=$1 AND e.event_id=$2 ON CONFLICT DO NOTHING`, [row.tenant_id,row.event_id,row.consumer_id,row.reason]);
      }
    }
    return { recovered:result.rows.filter(r=>r.status==='RETRYING').length, deadLettered:result.rows.filter(r=>r.status==='DEAD_LETTERED').length, total:result.rows.length };
  });
}
