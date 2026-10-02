import type { EventDeliveryClaim, DeliveryResult } from '../../platform/durable-events/contracts.ts';
import { runEffect, idempotencyEffect } from './runtime.ts';

export async function handle(event: EventDeliveryClaim): Promise<DeliveryResult> {
  if (!event.eventType) return { status: 'RETRY', reason: 'EVENT_TYPE_REQUIRED' };
  return runEffect(event, 'fulfillment', idempotencyEffect(event, 'fulfillment-domain'), async tx => {
    if (!['ORDER_PLACED','PAYMENT_CONFIRMED'].includes(event.eventType)) return;
    const order = (await tx.query(`select id,status,guest_address from trust_orders where id=$1 for update`, [event.aggregateId])).rows[0];
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (!['confirmed','processing'].includes(String(order.status))) return;
    const carrier = String(process.env.TRUST_DEFAULT_CARRIER ?? '').trim();
    const service = String(process.env.TRUST_DEFAULT_FULFILLMENT_SERVICE ?? '').trim();
    if (!carrier || !service) throw new Error('FULFILLMENT_PROVIDER_NOT_CONFIGURED');
    const existing = (await tx.query(`select id from trust_shipments where order_id=$1 and status not in ('DELIVERED','CANCELLED') limit 1`, [event.aggregateId])).rows[0];
    if (!existing) {
      const shipment = (await tx.query(`insert into trust_shipments(id,order_id,carrier,service,status,destination) values(gen_random_uuid(),$1,$2,$3,'PLANNED',$4::jsonb) returning id`, [event.aggregateId,carrier,service,order.guest_address ? JSON.stringify(order.guest_address) : null])).rows[0];
      if (!shipment) throw new Error('SHIPMENT_CREATE_FAILED');
      await tx.query(`insert into trust_shipment_tracking_events(id,shipment_id,event_type,status,occurred_at,description) values($1,$2,'STATUS','PLANNED',now(),'Shipment planned by commerce consumer') on conflict(id) do nothing`, [`consumer:${event.eventId}`,shipment.id]);
      await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json,tenant_id,correlation_id,causation_id) values('fulfillment.created',$1,$2::jsonb,$3,$4,$5)`, [event.aggregateId,JSON.stringify({shipmentId:shipment.id,orderId:event.aggregateId}),event.tenantId,event.correlationId??null,event.eventId]);
    }
    if (String(order.status) === 'confirmed') {
      await tx.query(`update trust_orders set status='processing',updated_at=now() where id=$1`, [event.aggregateId]);
      await tx.query(`insert into trust_order_status_history(order_id,from_status,to_status,source,note) values($1,'confirmed','processing','commerce_consumer:fulfillment','Shipment planned')`, [event.aggregateId]);
    }
  });
}
