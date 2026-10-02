import { randomUUID } from 'node:crypto';
import { cellForTenant, getCurrentCellId, runInCell } from '../cells/index.ts';
import { query, withPgTransaction } from '../db/postgres.ts';
import type { DurableEvent, EventDeliveryClaim } from './contracts.ts';
import { appendEventTx } from './tx.ts';

const MAX_PAYLOAD_BYTES = Number(process.env.TRUST_EVENT_MAX_PAYLOAD_BYTES ?? 256 * 1024);
const MAX_PAYLOAD_BYTES_SAFE = Number.isInteger(MAX_PAYLOAD_BYTES) && MAX_PAYLOAD_BYTES > 0 ? MAX_PAYLOAD_BYTES : 256 * 1024;

function assertEvent(input: Omit<DurableEvent, 'eventId' | 'sequenceNo' | 'occurredAt'>) {
  if (!input.tenantId || !input.eventType || !input.aggregateId || !input.idempotencyKey) throw new Error('EVENT_IDENTITY_REQUIRED');
  const bytes = Buffer.byteLength(JSON.stringify(input.payload ?? {}), 'utf8');
  if (bytes > MAX_PAYLOAD_BYTES_SAFE) throw new Error('EVENT_PAYLOAD_TOO_LARGE');
}

async function appendOnCurrentCell<T>(input: Omit<DurableEvent<T>, 'eventId' | 'sequenceNo' | 'occurredAt'>): Promise<DurableEvent<T>> {
  assertEvent(input);
  return withPgTransaction(client => appendEventTx(client, input));
}

export async function appendEvent<T>(input: Omit<DurableEvent<T>, 'eventId' | 'sequenceNo' | 'occurredAt'>): Promise<DurableEvent<T>> {
  const target = cellForTenant(input.tenantId);
  if (target === getCurrentCellId()) return appendOnCurrentCell(input);
  return runInCell(target, () => appendOnCurrentCell(input));
}

export async function enqueueDelivery(tenantId: string, eventId: string, consumerId: string) {
  if (!tenantId || !eventId || !consumerId) throw new Error('DELIVERY_IDENTITY_REQUIRED');
  await query(
    `INSERT INTO trust_event_deliveries(tenant_id,event_id,consumer_id,status,attempts,next_attempt_at)
     VALUES($1,$2,$3,'PENDING',0,now())
     ON CONFLICT (tenant_id,event_id,consumer_id) DO NOTHING`,
    [tenantId, eventId, consumerId],
  );
}

export async function getEvent(eventId: string, tenantId: string) {
  const result = await query<DurableEvent>(
    `SELECT event_id AS "eventId", tenant_id AS "tenantId", event_type AS "eventType", aggregate_id AS "aggregateId",
            sequence_no AS "sequenceNo", occurred_at AS "occurredAt", payload, correlation_id AS "correlationId",
            causation_id AS "causationId", idempotency_key AS "idempotencyKey", schema_version AS "schemaVersion"
       FROM trust_commerce_events WHERE tenant_id=$1 AND event_id=$2`,
    [tenantId, eventId],
  );
  return result.rows[0];
}

export async function claimDelivery(consumerId: string, workerId: string): Promise<EventDeliveryClaim | undefined> {
  return withPgTransaction(async client => {
    const result = await client.query<EventDeliveryClaim>(
      `WITH candidate AS (
         SELECT d.tenant_id, d.event_id, d.consumer_id
           FROM trust_event_deliveries d
          WHERE d.consumer_id=$1
            AND d.status IN ('PENDING','RETRYING')
            AND d.next_attempt_at <= now()
            AND (d.locked_at IS NULL OR d.locked_at < now() - interval '2 minutes')
            AND NOT EXISTS (
              SELECT 1
                FROM trust_event_deliveries prior_d
                JOIN trust_commerce_events prior_e ON prior_e.tenant_id=prior_d.tenant_id AND prior_e.event_id=prior_d.event_id
                JOIN trust_commerce_events current_e ON current_e.tenant_id=d.tenant_id AND current_e.event_id=d.event_id
               WHERE prior_d.tenant_id=d.tenant_id
                 AND prior_d.consumer_id=d.consumer_id
                 AND prior_e.aggregate_id=current_e.aggregate_id
                 AND prior_e.sequence_no < current_e.sequence_no
                 AND prior_d.status <> 'PROCESSED'
            )
          ORDER BY d.next_attempt_at ASC, d.created_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
       )
       UPDATE trust_event_deliveries d
          SET status='PROCESSING', locked_at=now(), locked_by=$2, attempts=d.attempts+1
         FROM candidate c
        WHERE d.tenant_id=c.tenant_id AND d.event_id=c.event_id AND d.consumer_id=c.consumer_id
       RETURNING d.tenant_id AS "tenantId", d.event_id AS "eventId", d.consumer_id AS "consumerId", d.attempts, d.status,
         (SELECT event_type FROM trust_commerce_events e WHERE e.tenant_id=d.tenant_id AND e.event_id=d.event_id) AS "eventType",
         (SELECT aggregate_id FROM trust_commerce_events e WHERE e.tenant_id=d.tenant_id AND e.event_id=d.event_id) AS "aggregateId",
         (SELECT sequence_no FROM trust_commerce_events e WHERE e.tenant_id=d.tenant_id AND e.event_id=d.event_id) AS "sequenceNo",
         (SELECT occurred_at FROM trust_commerce_events e WHERE e.tenant_id=d.tenant_id AND e.event_id=d.event_id) AS "occurredAt",
         (SELECT payload FROM trust_commerce_events e WHERE e.tenant_id=d.tenant_id AND e.event_id=d.event_id) AS payload,
         (SELECT correlation_id FROM trust_commerce_events e WHERE e.tenant_id=d.tenant_id AND e.event_id=d.event_id) AS "correlationId",
         (SELECT causation_id FROM trust_commerce_events e WHERE e.tenant_id=d.tenant_id AND e.event_id=d.event_id) AS "causationId",
         (SELECT idempotency_key FROM trust_commerce_events e WHERE e.tenant_id=d.tenant_id AND e.event_id=d.event_id) AS "idempotencyKey",
         (SELECT schema_version FROM trust_commerce_events e WHERE e.tenant_id=d.tenant_id AND e.event_id=d.event_id) AS "schemaVersion"`,
      [consumerId, workerId],
    );
    return result.rows[0];
  });
}

export async function renewDeliveryLease(input: { tenantId:string; eventId:string; consumerId:string; workerId:string }) {
  const result = await query(
    `UPDATE trust_event_deliveries
        SET locked_at=now(), locked_by=$4
      WHERE tenant_id=$1 AND event_id=$2 AND consumer_id=$3
        AND status='PROCESSING' AND locked_by=$4
      RETURNING event_id`,
    [input.tenantId,input.eventId,input.consumerId,input.workerId],
  );
  if (!result.rowCount) throw new Error('DELIVERY_LEASE_LOST');
  return true;
}

export async function completeDelivery(claim: EventDeliveryClaim, effectKey?: string) {
  await withPgTransaction(async client => {
    if (effectKey) {
      const effect = await client.query(
        `INSERT INTO trust_event_effects(tenant_id,effect_key,event_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING effect_key`,
        [claim.tenantId, effectKey, claim.eventId],
      );
      if (!effect.rowCount) {
        await client.query(`UPDATE trust_event_deliveries SET status='PROCESSED',locked_at=NULL,locked_by=NULL,reason='EFFECT_ALREADY_APPLIED' WHERE tenant_id=$1 AND event_id=$2 AND consumer_id=$3`, [claim.tenantId, claim.eventId, claim.consumerId]);
        return;
      }
    }
    await client.query(`UPDATE trust_event_deliveries SET status='PROCESSED',locked_at=NULL,locked_by=NULL,processed_at=now(),reason=NULL WHERE tenant_id=$1 AND event_id=$2 AND consumer_id=$3`, [claim.tenantId, claim.eventId, claim.consumerId]);
  });
}

export async function retryDelivery(claim: EventDeliveryClaim, reason: string, maxAttempts=8) {
  const terminal = claim.attempts >= maxAttempts;
  await query(
    `UPDATE trust_event_deliveries
        SET status=$4, locked_at=NULL, locked_by=NULL, reason=$5,
            next_attempt_at=CASE WHEN $4='RETRYING' THEN now() + make_interval(secs => LEAST(3600, POWER(2, GREATEST(0,$3-1)))) ELSE now() END
      WHERE tenant_id=$1 AND event_id=$2 AND consumer_id=$6`,
    [claim.tenantId, claim.eventId, claim.attempts, terminal ? 'DEAD_LETTERED' : 'RETRYING', reason.slice(0, 2000), claim.consumerId],
  );
  await query(
    `INSERT INTO trust_event_consumer_failures(tenant_id,event_id,consumer_id,failure_class,reason)
     VALUES($1,$2,$3,$4,$5)
     ON CONFLICT (tenant_id,event_id,consumer_id) DO UPDATE
       SET failure_class=EXCLUDED.failure_class, reason=EXCLUDED.reason, last_seen_at=now(), occurrences=trust_event_consumer_failures.occurrences+1`,
    [claim.tenantId, claim.eventId, claim.consumerId, terminal ? 'POISON_EVENT' : 'TRANSIENT_FAILURE', reason.slice(0, 2000)],
  );
  if (terminal) {
    await query(`INSERT INTO trust_event_dead_letters(tenant_id,event_id,consumer_id,reason,payload) VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT DO NOTHING`, [claim.tenantId, claim.eventId, claim.consumerId, reason.slice(0, 2000), JSON.stringify(claim.payload ?? {})]);
  }
}
