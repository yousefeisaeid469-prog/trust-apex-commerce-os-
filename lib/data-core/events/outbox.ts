import { randomUUID } from 'node:crypto';
import { query } from '@/modules/platform/db/postgres';

export type DomainEvent = {
  id?: string;
  type: string;
  aggregateType: string;
  aggregateId: string;
  occurredAt: string;
  payload: Record<string, unknown>;
  tenantId?: string;
  correlationId?: string;
  causationId?: string;
};

/** Durable compatibility adapter. New code should publish through the platform outbox transaction. */
export async function enqueue(event: DomainEvent): Promise<string> {
  const id = event.id ?? randomUUID();
  await query(
    `INSERT INTO trust_outbox_events(id,event_type,aggregate_id,payload_json,tenant_id,correlation_id,causation_id)
     VALUES($1,$2,$3,$4::jsonb,$5,$6,$7)`,
    [id, event.type, event.aggregateId, JSON.stringify({ ...event.payload, aggregateType: event.aggregateType, occurredAt: event.occurredAt }), event.tenantId ?? process.env.TRUST_DEFAULT_TENANT_ID ?? 'default', event.correlationId ?? null, event.causationId ?? null],
  );
  return id;
}

export async function pendingCount(): Promise<number> {
  const result = await query<{ count: string }>(`SELECT COUNT(*)::bigint AS count FROM trust_outbox_events WHERE status IN ('pending','failed') AND available_at <= now()`);
  return Number(result.rows[0]?.count ?? 0);
}

export async function listPending(limit = 50): Promise<DomainEvent[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const result = await query(`SELECT id,event_type,aggregate_id,payload_json,tenant_id,created_at FROM trust_outbox_events WHERE status IN ('pending','failed') AND available_at <= now() ORDER BY available_at,created_at LIMIT $1`, [safeLimit]);
  return result.rows.map((row: any) => ({ id: String(row.id), type: String(row.event_type), aggregateType: String(row.payload_json?.aggregateType ?? 'unknown'), aggregateId: String(row.aggregate_id), occurredAt: new Date(row.payload_json?.occurredAt ?? row.created_at).toISOString(), payload: row.payload_json ?? {}, tenantId: String(row.tenant_id) }));
}
