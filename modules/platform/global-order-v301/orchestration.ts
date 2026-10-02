import type { PoolClient } from 'pg';
import { createFulfillmentOrderTx } from '../../marketplace/fulfillment-runtime.ts';

export const GLOBAL_ORDER_ORCHESTRATION_VERSION = 'V301.0.0';
export type GlobalOrderOrchestrationStatus = 'CAPTURED'|'FULFILLMENT_PLANNED'|'IN_FULFILLMENT'|'DELIVERED'|'SETTLEMENT_RELEASED'|'COMPLETED'|'BLOCKED'|'REFUNDED';

const transitions: Record<GlobalOrderOrchestrationStatus, readonly GlobalOrderOrchestrationStatus[]> = {
  CAPTURED: ['FULFILLMENT_PLANNED','BLOCKED','REFUNDED'],
  FULFILLMENT_PLANNED: ['IN_FULFILLMENT','DELIVERED','BLOCKED','REFUNDED'],
  IN_FULFILLMENT: ['DELIVERED','BLOCKED','REFUNDED'],
  DELIVERED: ['SETTLEMENT_RELEASED','COMPLETED','REFUNDED'],
  SETTLEMENT_RELEASED: ['COMPLETED','REFUNDED'],
  COMPLETED: ['REFUNDED'],
  BLOCKED: ['FULFILLMENT_PLANNED','IN_FULFILLMENT','REFUNDED'],
  REFUNDED: []
};

export function canTransitionGlobalOrder(from: GlobalOrderOrchestrationStatus, to: GlobalOrderOrchestrationStatus) {
  return from === to || transitions[from].includes(to);
}

export function assertGlobalOrderTransition(from: GlobalOrderOrchestrationStatus, to: GlobalOrderOrchestrationStatus) {
  if (!canTransitionGlobalOrder(from, to)) throw new Error(`INVALID_GLOBAL_ORDER_TRANSITION:${from}->${to}`);
}

async function setStatus(tx: PoolClient, id: string, from: GlobalOrderOrchestrationStatus, to: GlobalOrderOrchestrationStatus, errorCode?: string | null) {
  assertGlobalOrderTransition(from, to);
  await tx.query(`update trust_global_order_orchestrations set status=$2,last_error_code=$3,updated_at=now() where id=$1`, [id, to, errorCode ?? null]);
}

/**
 * Called in the same DB transaction that confirms a global payment capture.
 * It is intentionally idempotent: every order gets one orchestration record,
 * and every order-shipment gets one fulfillment order through the fulfillment
 * runtime's own unique idempotency key.
 */
export async function orchestrateCapturedGlobalOrderTx(tx: PoolClient, input: { orderId: string; paymentId: string; idempotencyKey?: string }) {
  const order = (await tx.query<any>(`select id,status,currency,destination_country from trust_orders where id=$1 for update`, [input.orderId])).rows[0];
  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (!order.destination_country || !order.currency) return { skipped: true, reason: 'NOT_GLOBAL_ORDER' as const };

  const key = input.idempotencyKey ?? `global-order:${input.orderId}:capture`;
  const existing = (await tx.query<any>(`select * from trust_global_order_orchestrations where order_id=$1 for update`, [input.orderId])).rows[0];
  if (existing?.status === 'COMPLETED' || existing?.status === 'REFUNDED') return { ...existing, replay: true };

  const row = existing ?? (await tx.query<any>(`insert into trust_global_order_orchestrations(order_id,payment_id,status,idempotency_key) values($1,$2,'CAPTURED',$3) returning *`, [input.orderId, input.paymentId, key])).rows[0];
  if (!row) throw new Error('GLOBAL_ORDER_ORCHESTRATION_CREATE_FAILED');

  const shipments = (await tx.query<any>(`select id,merchant_id from trust_order_shipments where order_id=$1 order by created_at,id for update`, [input.orderId])).rows;
  if (!shipments.length) {
    await setStatus(tx, String(row.id), String(row.status) as GlobalOrderOrchestrationStatus, 'BLOCKED', 'GLOBAL_ORDER_SHIPMENT_PLAN_MISSING');
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('global.order.fulfillment.blocked',$1,$2::jsonb) on conflict do nothing`, [input.orderId, JSON.stringify({ orderId: input.orderId, reason: 'GLOBAL_ORDER_SHIPMENT_PLAN_MISSING' })]);
    return { orchestrationId: String(row.id), status: 'BLOCKED', fulfillmentOrderCount: 0, replay: false };
  }

  let created = 0;
  for (const shipment of shipments) {
    const fulfillment = await createFulfillmentOrderTx(tx, {
      orderShipmentId: String(shipment.id),
      merchantId: String(shipment.merchant_id),
      idempotencyKey: `global-fulfillment:${input.orderId}:${shipment.id}`
    });
    await tx.query(`update trust_marketplace_fulfillment_orders set global_orchestration_id=$2 where id=$1`, [fulfillment.id, row.id]);
    created++;
  }

  const current = String(row.status) as GlobalOrderOrchestrationStatus;
  if (current === 'CAPTURED' || current === 'BLOCKED') await setStatus(tx, String(row.id), current, 'FULFILLMENT_PLANNED');
  await tx.query(`update trust_global_order_orchestrations set payment_id=$2,fulfillment_order_count=$3,last_error_code=null,updated_at=now() where id=$1`, [row.id, input.paymentId, created]);
  // The existing commerce event consumer owns the confirmed -> processing transition.
  // Do not mutate it here or the PAYMENT_CONFIRMED consumer would see an invalid transition.
  const settlement = (await tx.query<any>(`select id from trust_marketplace_payment_settlements where payment_id=$1 limit 1`, [input.paymentId])).rows[0];
  await tx.query(`update trust_global_order_orchestrations set settlement_id=$2,updated_at=now() where id=$1`, [row.id, settlement?.id ?? null]);
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('global.order.fulfillment.planned',$1,$2::jsonb)`, [input.orderId, JSON.stringify({ orderId: input.orderId, paymentId: input.paymentId, orchestrationId: row.id, fulfillmentOrderCount: created })]);
  return { orchestrationId: String(row.id), status: 'FULFILLMENT_PLANNED', fulfillmentOrderCount: created, replay: false };
}
