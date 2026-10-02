import type { EventDeliveryClaim, DeliveryResult } from '../../platform/durable-events/contracts.ts';
import { randomUUID } from 'node:crypto';
import { runEffect, payloadObject, idempotencyEffect } from './runtime.ts';

export async function handle(event: EventDeliveryClaim): Promise<DeliveryResult> {
  if (!event.eventType) return { status: 'RETRY', reason: 'EVENT_TYPE_REQUIRED' };
  return runEffect(event, 'payment', idempotencyEffect(event, 'payment-domain'), async tx => {
    if (event.eventType !== 'ORDER_PLACED') return;
    const order = (await tx.query(`select id,customer_id,total,currency,payment_method,status from trust_orders where id=$1 for update`, [event.aggregateId])).rows[0];
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.payment_method !== 'card') return;
    if (!order.customer_id) throw new Error('CUSTOMER_REQUIRED_FOR_CARD_PAYMENT');
    const provider = String(process.env.TRUST_DEFAULT_PAYMENT_PROVIDER ?? process.env.PAYMENT_PROVIDER ?? '').trim();
    if (!provider) throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED');
    const idempotencyKey = `event:${event.eventId}:payment`;
    const existing = (await tx.query(`select id from trust_payments where idempotency_key=$1 for update`, [idempotencyKey])).rows[0];
    if (existing) return;
    const paymentIntentId = `pi_trust_${randomUUID()}`;
    const inserted = await tx.query(`insert into trust_payments(order_id,provider,payment_intent_id,amount,currency,status,idempotency_key) values($1,$2,$3,$4,$5,'pending',$6) on conflict(idempotency_key) do nothing returning id`, [event.aggregateId,provider,paymentIntentId,Number(order.total),String(order.currency),idempotencyKey]);
    if (!inserted.rows[0]) return;
    const result = { paymentId: inserted.rows[0].id, orderId: event.aggregateId, paymentIntentId, status: 'pending', amount: Number(order.total), currency: String(order.currency) };
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json,tenant_id,correlation_id,causation_id) values('payment.pending',$1,$2::jsonb,$3,$4,$5)`, [event.aggregateId,JSON.stringify(result),event.tenantId,event.correlationId??null,event.eventId]);
    await tx.query(`insert into trust_payment_provider_jobs(kind,payment_id,provider,idempotency_key) values('CREATE_PAYMENT',$1,$2,$3) on conflict(idempotency_key) do nothing`, [inserted.rows[0].id,provider,`payment:${idempotencyKey}`]);
  });
}
