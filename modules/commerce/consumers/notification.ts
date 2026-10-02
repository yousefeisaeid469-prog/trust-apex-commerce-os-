import type { EventDeliveryClaim, DeliveryResult } from '../../platform/durable-events/contracts.ts';
import { queueOrderStatusNotificationsTx } from '../../platform/notifications-3';
import { runEffect, payloadObject, idempotencyEffect } from './runtime.ts';

export async function handle(event: EventDeliveryClaim): Promise<DeliveryResult> {
  if (!event.eventType) return { status: 'RETRY', reason: 'EVENT_TYPE_REQUIRED' };
  return runEffect(event, 'notification', idempotencyEffect(event, 'notification-domain'), async tx => {
    const row = (await tx.query(`select customer_id,status from trust_orders where id=$1 for update`, [event.aggregateId])).rows[0];
    if (!row) throw new Error('ORDER_NOT_FOUND');
    if (row.customer_id) await queueOrderStatusNotificationsTx(tx, { orderId: event.aggregateId, customerId: String(row.customer_id), status: String(row.status) });
  });
}
