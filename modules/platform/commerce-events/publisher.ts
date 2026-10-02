import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { withPgTransaction, query } from '../db/postgres.ts';
import { appendEventTx } from '../durable-events/tx.ts';
import { normalizeOutboxEventType } from './core.ts';

export type PublisherTrigger = 'vercel-cron' | 'standalone' | 'manual' | 'internal';
export type PublisherRunResult = { runId: string; workerId: string; trigger: PublisherTrigger; claimed: number; published: number; retried: number; dead: number; failed: number; durationMs: number };

const DEFAULT_MAX_ATTEMPTS = 8;
const DEFAULT_BATCH_SIZE = 25;
const MAX_BATCH_SIZE = 100;

function intEnv(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function retryDelaySeconds(attempts: number) {
  return Math.min(3600, 2 ** Math.max(0, Math.min(attempts - 1, 10)));
}

async function claimOne(client: PoolClient, workerId: string) {
  const result = await client.query<any>(`
    WITH candidate AS (
      SELECT id FROM trust_outbox_events
      WHERE ((status IN ('pending','failed') AND available_at <= now())
          OR (status='processing' AND (locked_at IS NULL OR locked_at < now() - interval '2 minutes')))
        AND status <> 'dead'
      ORDER BY available_at ASC, created_at ASC, id ASC
      FOR UPDATE SKIP LOCKED LIMIT 1
    )
    UPDATE trust_outbox_events o
       SET status='processing', attempts=o.attempts+1, locked_at=now(), locked_by=$1, last_error=NULL
      FROM candidate c
     WHERE o.id=c.id
    RETURNING o.id,o.event_type,o.aggregate_id,o.payload_json,o.tenant_id,o.attempts,o.created_at`, [workerId]);
  return result.rows[0] ?? null;
}

async function publishClaim(client: PoolClient, row: any) {
  const payload = row.payload_json && typeof row.payload_json === 'object' ? row.payload_json : {};
  const tenantId = String(row.tenant_id || (process.env.TRUST_DEFAULT_TENANT_ID ?? 'default'));
  const event = await appendEventTx(client, {
    tenantId,
    eventType: normalizeOutboxEventType(String(row.event_type), payload),
    aggregateId: String(row.aggregate_id),
    payload,
    correlationId: typeof payload.correlationId === 'string' ? payload.correlationId : undefined,
    causationId: typeof payload.causationId === 'string' ? payload.causationId : undefined,
    idempotencyKey: `outbox:${row.id}`,
    schemaVersion: Number(payload.schemaVersion ?? 1),
  });
  await client.query(`UPDATE trust_outbox_events SET status='published',published_at=now(),locked_at=NULL,locked_by=NULL,last_error=NULL WHERE id=$1`, [row.id]);
  return event;
}

export async function runCommerceEventPublisher(input: { trigger?: PublisherTrigger; workerId?: string; batchSize?: number; maxAttempts?: number } = {}): Promise<PublisherRunResult> {
  const started = Date.now();
  const trigger = input.trigger ?? 'manual';
  const workerId = input.workerId ?? `commerce-publisher-${randomUUID()}`;
  const batchSize = Math.min(intEnv('TRUST_COMMERCE_EVENT_PUBLISHER_BATCH_SIZE', DEFAULT_BATCH_SIZE), MAX_BATCH_SIZE, Math.max(1, input.batchSize ?? DEFAULT_BATCH_SIZE));
  const maxAttempts = Math.min(intEnv('TRUST_COMMERCE_EVENT_PUBLISHER_MAX_ATTEMPTS', DEFAULT_MAX_ATTEMPTS), 50, Math.max(1, input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS));
  const runId = await query<any>(`INSERT INTO trust_commerce_event_publisher_runs(worker_id,trigger,status) VALUES($1,$2,'RUNNING') RETURNING id`, [workerId, trigger]).then(r => String(r.rows[0].id));
  await query(`UPDATE trust_commerce_event_publisher_heartbeat SET last_started_at=now(),last_worker_id=$1,last_trigger=$2,updated_at=now() WHERE singleton=true`, [workerId, trigger]);
  let claimed = 0, published = 0, retried = 0, dead = 0, failed = 0;
  let lastError: string | null = null;
  try {
    for (let i = 0; i < batchSize; i++) {
      let outcome: 'published' | 'retried' | 'dead' | 'failed' | 'idle' = 'idle';
      await withPgTransaction(async client => {
        const row = await claimOne(client, workerId);
        if (!row) return;
        claimed++;
        try {
          await publishClaim(client, row);
          outcome = 'published';
        } catch (error) {
          const message = (error instanceof Error ? error.message : 'PUBLISH_FAILED').slice(0, 2000);
          lastError = message;
          const attempts = Number(row.attempts);
          if (attempts >= maxAttempts) {
            await client.query(`UPDATE trust_outbox_events SET status='dead',dead_at=now(),locked_at=NULL,locked_by=NULL,last_error=$2 WHERE id=$1`, [row.id, message]);
            outcome = 'dead';
          } else {
            const delay = retryDelaySeconds(attempts);
            await client.query(`UPDATE trust_outbox_events SET status='failed',available_at=now()+make_interval(secs=>$2),locked_at=NULL,locked_by=NULL,last_error=$3 WHERE id=$1`, [row.id, delay, message]);
            outcome = 'retried';
          }
        }
      });
      if (outcome === 'idle') break;
      if (outcome === 'published') published++;
      else if (outcome === 'retried') retried++;
      else if (outcome === 'dead') dead++;
      else failed++;
    }
    const status = dead > 0 || failed > 0 ? 'DEGRADED' : 'SUCCEEDED';
    await query(`UPDATE trust_commerce_event_publisher_runs SET status=$2,claimed=$3,published=$4,retried=$5,dead=$6,failed=$7,last_error=$8,finished_at=now(),updated_at=now() WHERE id=$1`, [runId,status,claimed,published,retried,dead,failed,lastError]);
    await query(`UPDATE trust_commerce_event_publisher_heartbeat SET last_started_at=COALESCE(last_started_at,now()),last_finished_at=now(),last_success_at=case when $2='SUCCEEDED' then now() else last_success_at end,last_failure_at=case when $2<>'SUCCEEDED' then now() else last_failure_at end,last_worker_id=$1,last_trigger=$3,last_claimed=$4,last_published=$5,last_retried=$6,last_dead=$7,last_failed=$8,last_error=$9,updated_at=now() WHERE singleton=true`, [workerId,status,trigger,claimed,published,retried,dead,failed,lastError]);
    return { runId, workerId, trigger, claimed, published, retried, dead, failed, durationMs: Date.now() - started };
  } catch (error) {
    lastError = (error instanceof Error ? error.message : 'PUBLISHER_RUN_FAILED').slice(0, 2000);
    await query(`UPDATE trust_commerce_event_publisher_runs SET status='FAILED',claimed=$2,published=$3,retried=$4,dead=$5,failed=$6,last_error=$7,finished_at=now(),updated_at=now() WHERE id=$1`, [runId,claimed,published,retried,dead,failed,lastError]).catch(() => undefined);
    await query(`UPDATE trust_commerce_event_publisher_heartbeat SET last_started_at=COALESCE(last_started_at,now()),last_finished_at=now(),last_failure_at=now(),last_worker_id=$1,last_trigger=$2,last_claimed=$3,last_published=$4,last_retried=$5,last_dead=$6,last_failed=$7,last_error=$8,updated_at=now() WHERE singleton=true`, [workerId,trigger,claimed,published,retried,dead,failed,lastError]).catch(() => undefined);
    throw error;
  }
}

export async function publisherQueueSnapshot() {
  const result = await query<any>(`SELECT count(*) FILTER (WHERE status IN ('pending','failed') AND available_at<=now())::int ready,count(*) FILTER (WHERE status='processing')::int processing,count(*) FILTER (WHERE status='dead')::int dead,min(available_at) FILTER (WHERE status IN ('pending','failed')) next_available_at FROM trust_outbox_events`);
  return result.rows[0] ?? {};
}
