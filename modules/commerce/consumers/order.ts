import type { EventDeliveryClaim, DeliveryResult } from '../../platform/durable-events/contracts.ts';
import { transitionDurableOrder } from '../orders/state.ts';
import { runEffect, payloadObject, idempotencyEffect } from './runtime.ts';

export async function handle(event: EventDeliveryClaim): Promise<DeliveryResult> {
  if (!event.eventType) return { status: 'RETRY', reason: 'EVENT_TYPE_REQUIRED' };
  return runEffect(event, 'order', idempotencyEffect(event, 'order-domain'), async tx => {
    if (event.eventType === 'PAYMENT_CONFIRMED') await transitionDurableOrder(tx, { orderId: event.aggregateId, to: 'confirmed', source: 'commerce_consumer:payment_confirmed' });
    else if (event.eventType === 'REFUND_ISSUED') await transitionDurableOrder(tx, { orderId: event.aggregateId, to: 'refunded', source: 'commerce_consumer:refund_issued' });
    else {
      const order = (await tx.query(`select id from trust_orders where id=$1 for update`, [event.aggregateId])).rows[0];
      if (!order) throw new Error('ORDER_NOT_FOUND');
      await tx.query(`insert into trust_order_execution_log(tenant_id,order_id,event_id,event_type,payload_json) values($1,$2,$3,$4,$5::jsonb) on conflict(tenant_id,event_id) do nothing`, [event.tenantId,event.aggregateId,event.eventId,event.eventType,JSON.stringify(payloadObject(event))]);
    }
  });
}
