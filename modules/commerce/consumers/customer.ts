import type { EventDeliveryClaim, DeliveryResult } from '../../platform/durable-events/contracts.ts';
import { runEffect, payloadObject, idempotencyEffect } from './runtime.ts';

export async function handle(event: EventDeliveryClaim): Promise<DeliveryResult> {
  if (!event.eventType) return { status: 'RETRY', reason: 'EVENT_TYPE_REQUIRED' };
  return runEffect(event, 'customer', idempotencyEffect(event, 'customer-domain'), async tx => {
    const customerId = (payloadObject(event).customerId ?? null) as string | null;
    const order = (await tx.query(`select customer_id from trust_orders where id=$1`, [event.aggregateId])).rows[0];
    const id = customerId ?? (order?.customer_id ? String(order.customer_id) : null);
    if (!id) return;
    await tx.query(`insert into trust_customer_timeline(id,customer_id,kind,entity_type,entity_id,action,summary,metadata,occurred_at) values(gen_random_uuid(),$1,'ORDER','order',$2,$3,$4,$5::jsonb,now()) on conflict(customer_id,entity_type,entity_id,action) do nothing`, [id,event.aggregateId,`COMMERCE_${event.eventType}`,`Commerce event ${event.eventType}`,JSON.stringify({eventId:event.eventId,tenantId:event.tenantId,payload:payloadObject(event)})]);
    await tx.query(`insert into trust_customer_activity(id,customer_id,action,entity_type,entity_id,metadata,created_at) values(gen_random_uuid(),$1,$2,'order',$3,$4::jsonb,now())`, [id,`COMMERCE_${event.eventType}`,event.aggregateId,JSON.stringify({eventId:event.eventId})]);
  });
}
