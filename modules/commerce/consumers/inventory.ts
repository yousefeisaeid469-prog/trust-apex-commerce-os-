import type { EventDeliveryClaim, DeliveryResult } from '../../platform/durable-events/contracts.ts';
import { runEffect, idempotencyEffect } from './runtime.ts';

export async function handle(event: EventDeliveryClaim): Promise<DeliveryResult> {
  if (!event.eventType) return { status: 'RETRY', reason: 'EVENT_TYPE_REQUIRED' };
  return runEffect(event, 'inventory', idempotencyEffect(event, 'inventory-domain'), async tx => {
    if (event.eventType === 'ORDER_PLACED') {
      const rows = (await tx.query(`select product_id,quantity,status from trust_inventory_reservations where order_id=$1`, [event.aggregateId])).rows;
      if (!rows.length) throw new Error('INVENTORY_RESERVATION_NOT_FOUND');
      if (rows.some((r:any) => !['reserved','consumed'].includes(String(r.status)))) throw new Error('INVENTORY_RESERVATION_INVALID');
    } else if (event.eventType === 'RETURN_REQUESTED') {
      const ret = (await tx.query(`select id,status from trust_returns where id=$1`, [event.aggregateId])).rows[0];
      if (!ret) throw new Error('RETURN_NOT_FOUND');
      if (String(ret.status) !== 'REQUESTED') throw new Error('RETURN_NOT_REQUESTED');
    }
  });
}
