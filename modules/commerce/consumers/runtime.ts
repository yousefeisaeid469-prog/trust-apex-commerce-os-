import { randomUUID } from 'node:crypto';
import { withPgTransaction } from '../../platform/db/postgres.ts';
import type { EventDeliveryClaim, DeliveryResult } from '../../platform/durable-events/contracts.ts';

export async function runEffect(event: EventDeliveryClaim, consumerId: string, effectKey: string, work: (tx: any) => Promise<void>): Promise<DeliveryResult> {
  await withPgTransaction(async tx => {
    const inserted = await tx.query(
      `INSERT INTO trust_domain_effects(id,tenant_id,event_id,consumer_id,effect_key,status)
       VALUES($1,$2,$3,$4,$5,'PROCESSING') ON CONFLICT(tenant_id,consumer_id,effect_key) DO NOTHING RETURNING id`,
      [randomUUID(), event.tenantId, event.eventId, consumerId, effectKey],
    );
    if (!inserted.rows[0]) return;
    await work(tx);
    await tx.query(`UPDATE trust_domain_effects SET status='COMPLETED',completed_at=now() WHERE id=$1`, [inserted.rows[0].id]);
  });
  return { status: 'PROCESSED', effectKey };
}

export function payloadObject(event: EventDeliveryClaim): Record<string, any> {
  return event.payload && typeof event.payload === 'object' ? event.payload as Record<string, any> : {};
}

export function idempotencyEffect(event: EventDeliveryClaim, suffix: string) {
  return `${event.eventId}:${suffix}`;
}
