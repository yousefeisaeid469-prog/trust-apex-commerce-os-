import type { EventDeliveryClaim, DeliveryResult } from '../../platform/durable-events/contracts.ts';
import { runEffect, idempotencyEffect } from './runtime.ts';

export async function handle(event: EventDeliveryClaim): Promise<DeliveryResult> {
  if (!event.eventType) return { status: 'RETRY', reason: 'EVENT_TYPE_REQUIRED' };
  return runEffect(event, 'returns', idempotencyEffect(event, 'returns-domain'), async tx => {
    if (event.eventType === 'RETURN_REQUESTED') {
      const row = (await tx.query(`select id,status,order_id from trust_returns where id=$1 for update`, [event.aggregateId])).rows[0];
      if (!row) throw new Error('RETURN_NOT_FOUND');
      if (String(row.status) !== 'REQUESTED') throw new Error('RETURN_STATE_CHANGED');
      await tx.query(`insert into trust_return_execution_log(tenant_id,return_id,event_id,event_type) values($1,$2,$3,$4) on conflict(tenant_id,event_id) do nothing`, [event.tenantId,event.aggregateId,event.eventId,event.eventType]);
    } else if (event.eventType === 'REFUND_ISSUED') {
      await tx.query(`insert into trust_return_execution_log(tenant_id,return_id,event_id,event_type) select $1,return_id,$2,$3 from trust_refunds where id=$4 on conflict(tenant_id,event_id) do nothing`, [event.tenantId,event.eventId,event.eventType,(event.payload as any)?.refundId ?? null]);
    }
  });
}
