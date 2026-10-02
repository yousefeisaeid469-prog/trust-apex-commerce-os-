import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import type { DurableEvent } from './contracts.ts';
import { enqueueSubscribedDeliveriesTx, validateEventContractTx } from '../commerce-events/registry.ts';

const MAX_PAYLOAD_BYTES = Number(process.env.TRUST_EVENT_MAX_PAYLOAD_BYTES ?? 256 * 1024);
const MAX_PAYLOAD_BYTES_SAFE = Number.isInteger(MAX_PAYLOAD_BYTES) && MAX_PAYLOAD_BYTES > 0 ? MAX_PAYLOAD_BYTES : 256 * 1024;

export async function appendEventTx<T>(client: PoolClient, input: Omit<DurableEvent<T>, 'eventId' | 'sequenceNo' | 'occurredAt'>): Promise<DurableEvent<T>> {
  if (!input.tenantId || !input.eventType || !input.aggregateId || !input.idempotencyKey) throw new Error('EVENT_IDENTITY_REQUIRED');
  const payload = input.payload ?? ({} as T);
  const schemaVersion = Number((input as any).schemaVersion ?? 1);
  await validateEventContractTx(client, input.eventType, schemaVersion, payload);
  if (Buffer.byteLength(JSON.stringify(payload), 'utf8') > MAX_PAYLOAD_BYTES_SAFE) throw new Error('EVENT_PAYLOAD_TOO_LARGE');

  const existing = await client.query<DurableEvent<T>>(
    `SELECT event_id AS "eventId", tenant_id AS "tenantId", event_type AS "eventType", aggregate_id AS "aggregateId",
            sequence_no AS "sequenceNo", occurred_at AS "occurredAt", payload, correlation_id AS "correlationId",
            causation_id AS "causationId", idempotency_key AS "idempotencyKey"
       FROM trust_commerce_events
      WHERE tenant_id=$1 AND idempotency_key=$2 LIMIT 1`,
    [input.tenantId, input.idempotencyKey],
  );
  if (existing.rows[0]) return existing.rows[0];

  await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`trust-event-sequence:${input.tenantId}:${input.aggregateId}`]);
  const sequence = await client.query<{ sequence: string }>(
    `SELECT COALESCE(MAX(sequence_no),0)::bigint + 1 AS sequence FROM trust_commerce_events WHERE tenant_id=$1 AND aggregate_id=$2`,
    [input.tenantId, input.aggregateId],
  );
  const result = await client.query<DurableEvent<T>>(
    `INSERT INTO trust_commerce_events
      (event_id,tenant_id,event_type,aggregate_id,sequence_no,occurred_at,payload,correlation_id,causation_id,idempotency_key,schema_version)
     VALUES($1,$2,$3,$4,$5,now(),$6::jsonb,$7,$8,$9,$10)
     RETURNING event_id AS "eventId",tenant_id AS "tenantId",event_type AS "eventType",aggregate_id AS "aggregateId",
               sequence_no AS "sequenceNo",occurred_at AS "occurredAt",payload,correlation_id AS "correlationId",
               causation_id AS "causationId",idempotency_key AS "idempotencyKey",schema_version AS "schemaVersion"`,
    [randomUUID(), input.tenantId, input.eventType, input.aggregateId, Number(sequence.rows[0].sequence), JSON.stringify(payload), input.correlationId ?? null, input.causationId ?? null, input.idempotencyKey, schemaVersion],
  );
  const event = result.rows[0];
  await enqueueSubscribedDeliveriesTx(client, { tenantId: String(event.tenantId), eventId: String(event.eventId), eventType: String(event.eventType) });
  return event;
}
