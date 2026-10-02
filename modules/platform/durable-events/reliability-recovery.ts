import { randomUUID } from 'node:crypto';
import { query, withPgTransaction } from '../db/postgres.ts';
import { getCommerceReliabilityTrace, materializeCommerceReliabilityTrace } from './reliability-fabric.ts';

type RecoveryAction = {
  action: 'RECLAIM_ORDER_CONSUMER_LEASES' | 'RECLAIM_ORDER_EXECUTION_LEASES' | 'NOOP';
  requested: boolean;
  changed: number;
  details: string;
  verified: boolean;
};

async function reclaimOrderConsumerLeases(orderId: string) {
  return withPgTransaction(async client => {
    const result = await client.query<any>(
      `WITH stale AS (
         SELECT d.tenant_id,d.event_id,d.consumer_id,d.attempts AS delivery_attempts,
                COALESCE(s.max_attempts,8) AS max_attempts,e.payload
           FROM trust_event_deliveries d
           JOIN trust_commerce_events e
             ON e.tenant_id=d.tenant_id AND e.event_id=d.event_id
           LEFT JOIN trust_consumer_subscriptions s
             ON s.consumer_id=d.consumer_id AND s.event_type=e.event_type
          WHERE d.status='PROCESSING'
            AND d.locked_at < now() - interval '2 minutes'
            AND (e.aggregate_id=$1::text OR e.payload->>'orderId'=$1::text)
          ORDER BY d.locked_at ASC
          FOR UPDATE OF d SKIP LOCKED
          LIMIT 500
       ), changed AS (
         UPDATE trust_event_deliveries d SET
           status=CASE WHEN stale.delivery_attempts >= stale.max_attempts THEN 'DEAD_LETTERED' ELSE 'RETRYING' END,
           locked_at=NULL,locked_by=NULL,
           reason=CASE WHEN stale.delivery_attempts >= stale.max_attempts THEN 'V373_ORDER_RECOVERY_MAX_ATTEMPTS' ELSE 'V373_ORDER_RECOVERY_RECLAIMED' END,
           next_attempt_at=now()
          FROM stale
         WHERE d.tenant_id=stale.tenant_id AND d.event_id=stale.event_id AND d.consumer_id=stale.consumer_id
         RETURNING d.tenant_id,d.event_id,d.consumer_id,d.status,d.reason
       ) SELECT * FROM changed`,
      [orderId],
    );
    for (const row of result.rows) {
      const action = row.status === 'DEAD_LETTERED' ? 'DEAD_LETTER_STALE' : 'RECLAIM_PROCESSING';
      const key = `v373:${action}:${row.tenant_id}:${row.event_id}:${row.consumer_id}`;
      await client.query(
        `INSERT INTO trust_commerce_consumer_recovery_actions(action_key,consumer_id,tenant_id,event_id,action,result,reason)
         VALUES($1,$2,$3,$4,$5,'APPLIED',$6) ON CONFLICT(action_key) DO NOTHING`,
        [key,row.consumer_id,row.tenant_id,row.event_id,action,row.reason],
      );
      if (row.status === 'DEAD_LETTERED') {
        await client.query(
          `INSERT INTO trust_event_dead_letters(tenant_id,event_id,consumer_id,reason,payload)
           SELECT $1,$2,$3,$4,e.payload FROM trust_commerce_events e
           WHERE e.tenant_id=$1 AND e.event_id=$2 ON CONFLICT DO NOTHING`,
          [row.tenant_id,row.event_id,row.consumer_id,row.reason],
        );
      }
    }
    return { recovered: result.rows.filter(r => r.status === 'RETRYING').length, deadLettered: result.rows.filter(r => r.status === 'DEAD_LETTERED').length, total: result.rows.length };
  });
}

async function reclaimOrderExecutionLeases(orderId: string) {
  const result = await query<any>(
    `WITH stale AS (
       SELECT id FROM trust_commerce_execution_jobs
        WHERE order_id=$1 AND status='PROCESSING' AND lease_until < now()
        ORDER BY lease_until ASC FOR UPDATE SKIP LOCKED LIMIT 500
     )
     UPDATE trust_commerce_execution_jobs j
        SET status='PENDING', lease_until=NULL, lease_token=NULL, available_at=now(), updated_at=now()
       FROM stale s WHERE j.id=s.id
     RETURNING j.id`,
    [orderId],
  );
  return result.rowCount ?? 0;
}

async function staleOrderExecutionCount(orderId: string) {
  const result = await query<any>(
    `SELECT count(*)::int count FROM trust_commerce_execution_jobs WHERE order_id=$1 AND status='PROCESSING' AND lease_until < now()`,
    [orderId],
  );
  return Number(result.rows[0]?.count || 0);
}

async function staleOrderConsumerCount(orderId: string) {
  const result = await query<any>(
    `SELECT count(*)::int count
       FROM trust_event_deliveries d
       JOIN trust_commerce_events e ON e.tenant_id=d.tenant_id AND e.event_id=d.event_id
      WHERE d.status='PROCESSING' AND d.locked_at < now()-interval '2 minutes'
        AND (e.aggregate_id=$1::text OR e.payload->>'orderId'=$1::text)`,
    [orderId],
  );
  return Number(result.rows[0]?.count || 0);
}

export async function runVerifiedOrderRecovery(orderId: string, trigger='manual') {
  if (!orderId) throw new Error('ORDER_ID_REQUIRED');
  const before = await materializeCommerceReliabilityTrace(orderId);
  const actions: RecoveryAction[] = [];

  const staleConsumers = await staleOrderConsumerCount(orderId);
  if (staleConsumers > 0) {
    const result = await reclaimOrderConsumerLeases(orderId);
    actions.push({
      action: 'RECLAIM_ORDER_CONSUMER_LEASES', requested: true,
      changed: result.total,
      details: `stale=${staleConsumers};recovered=${result.recovered};deadLettered=${result.deadLettered}`,
      verified: false,
    });
  }

  const staleExecutions = await staleOrderExecutionCount(orderId);
  if (staleExecutions > 0) {
    const changed = await reclaimOrderExecutionLeases(orderId);
    actions.push({
      action: 'RECLAIM_ORDER_EXECUTION_LEASES', requested: true,
      changed,
      details: `stale=${staleExecutions};reclaimed=${changed}`,
      verified: false,
    });
  }

  if (!actions.length) {
    actions.push({ action:'NOOP', requested:false, changed:0, details:'No safe stale lease was found for this order.', verified:true });
  }

  const after = await materializeCommerceReliabilityTrace(orderId);
  const remainingConsumer = await staleOrderConsumerCount(orderId);
  const remainingExecution = await staleOrderExecutionCount(orderId);

  for (const action of actions) {
    if (action.action === 'RECLAIM_ORDER_CONSUMER_LEASES') action.verified = remainingConsumer < staleConsumers;
    if (action.action === 'RECLAIM_ORDER_EXECUTION_LEASES') action.verified = remainingExecution < staleExecutions;
  }

  const verified = actions.every(a => a.verified);
  const runKey = `order-recovery:${orderId}:${trigger}:${randomUUID()}`;
  const persisted = await withPgTransaction(async client => {
    const result = await client.query<any>(
      `INSERT INTO trust_commerce_reliability_recovery_runs
       (run_key,order_id,trace_id,trigger,before_state,before_root_cause,after_state,after_root_cause,actions,verified)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)
       RETURNING id,run_key,order_id,trace_id,trigger,before_state,before_root_cause,after_state,after_root_cause,actions,verified,created_at`,
      [runKey,orderId,before.trace.id,trigger,before.trace.state,before.trace.root_cause_code,after.trace.state,after.trace.root_cause_code,JSON.stringify(actions),verified],
    );
    return result.rows[0];
  });

  return { run: persisted, before, after, actions, verified };
}

export async function getLatestOrderRecovery(orderId: string) {
  const result = await query<any>(
    `SELECT id,run_key,order_id,trace_id,trigger,before_state,before_root_cause,after_state,after_root_cause,actions,verified,created_at
       FROM trust_commerce_reliability_recovery_runs WHERE order_id=$1 ORDER BY created_at DESC LIMIT 1`,
    [orderId],
  );
  return result.rows[0] ?? null;
}
