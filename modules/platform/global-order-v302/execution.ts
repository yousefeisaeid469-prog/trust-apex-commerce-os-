import type { PoolClient } from 'pg';
import { transitionFulfillmentOrderTx } from '../../marketplace/fulfillment-runtime.ts';
import { releaseDeliveredSettlementTx } from '../../marketplace/financial-loop.ts';
import { assertGlobalOrderTransition, type GlobalOrderOrchestrationStatus } from '../global-order-v301/orchestration.ts';

export const GLOBAL_FULFILLMENT_EXECUTION_VERSION = 'V302.0.0';

type Result = {
  global: boolean;
  orchestrationId?: string;
  status?: GlobalOrderOrchestrationStatus;
  totalFulfillmentOrders?: number;
  deliveredFulfillmentOrders?: number;
  settlementReleased?: boolean;
  completed?: boolean;
  replay?: boolean;
  waiting?: boolean;
};

async function moveOrchestration(tx: PoolClient, id: string, from: GlobalOrderOrchestrationStatus, to: GlobalOrderOrchestrationStatus) {
  if (from === to) return;
  assertGlobalOrderTransition(from, to);
  await tx.query(`update trust_global_order_orchestrations set status=$2,updated_at=now() where id=$1`, [id, to]);
}

/**
 * Reconciles one delivered shipment into the global order aggregate.
 * A global order becomes DELIVERED only after every fulfillment order is DELIVERED.
 * Seller settlement is released only after that aggregate delivery gate passes.
 */
export async function completeGlobalDeliveryTx(tx: PoolClient, input: { orderId: string; shipmentId: string; triggerKey: string }): Promise<Result> {
  const orch = (await tx.query<any>(`select * from trust_global_order_orchestrations where order_id=$1 for update`, [input.orderId])).rows[0];
  if (!orch) return { global: false };

  const prior = (await tx.query<any>(`select * from trust_global_order_execution_runs where trigger_key=$1 for update`, [input.triggerKey])).rows[0];
  if (prior?.status === 'COMPLETED') {
    return { global: true, orchestrationId: String(orch.id), status: String(orch.status) as GlobalOrderOrchestrationStatus, totalFulfillmentOrders: Number(prior.total_fulfillment_orders), deliveredFulfillmentOrders: Number(prior.delivered_fulfillment_orders), settlementReleased: Boolean(prior.settlement_release_id), completed: String(orch.status) === 'COMPLETED', replay: true };
  }

  const run = prior ?? (await tx.query<any>(`insert into trust_global_order_execution_runs(orchestration_id,order_id,trigger_key,trigger_type,status) values($1,$2,$3,'SHIPMENT_DELIVERED','RUNNING') returning *`, [orch.id, input.orderId, input.triggerKey])).rows[0];

  const linked = (await tx.query<any>(`select f.*,s.status shipment_status from trust_marketplace_fulfillment_orders f left join trust_shipments s on s.id=f.shipment_id where f.global_orchestration_id=$1 order by f.created_at,f.id for update`, [orch.id])).rows;
  if (!linked.length) {
    await tx.query(`update trust_global_order_execution_runs set status='BLOCKED',error_code='GLOBAL_FULFILLMENT_ORDERS_MISSING',updated_at=now() where id=$1`, [run.id]);
    await tx.query(`update trust_global_order_orchestrations set status='BLOCKED',last_error_code='GLOBAL_FULFILLMENT_ORDERS_MISSING',updated_at=now() where id=$1`, [orch.id]);
    return { global: true, orchestrationId: String(orch.id), status: 'BLOCKED', totalFulfillmentOrders: 0, deliveredFulfillmentOrders: 0, settlementReleased: false, completed: false };
  }

  // First make the fulfillment runtime reflect the authoritative shipment delivery.
  for (const f of linked) {
    if (String(f.shipment_status) === 'DELIVERED' && String(f.status) !== 'DELIVERED') {
      await transitionFulfillmentOrderTx(tx, { fulfillmentOrderId: String(f.id), merchantId: String(f.merchant_id), toStatus: 'DELIVERED', idempotencyKey: `global-delivery:${input.shipmentId}:${f.id}` });
    }
  }

  const counts = (await tx.query<any>(`select count(*)::int total, count(*) filter(where status='DELIVERED')::int delivered from trust_marketplace_fulfillment_orders where global_orchestration_id=$1`, [orch.id])).rows[0];
  const total = Number(counts.total ?? 0);
  const delivered = Number(counts.delivered ?? 0);
  await tx.query(`update trust_global_order_orchestrations set delivered_fulfillment_order_count=$2,last_delivery_at=now(),updated_at=now() where id=$1`, [orch.id, delivered]);

  if (delivered < total) {
    await tx.query(`update trust_global_order_execution_runs set status='WAITING',total_fulfillment_orders=$2,delivered_fulfillment_orders=$3,updated_at=now() where id=$1`, [run.id, total, delivered]);
    const current = String(orch.status) as GlobalOrderOrchestrationStatus;
    if (current === 'FULFILLMENT_PLANNED') await moveOrchestration(tx, String(orch.id), current, 'IN_FULFILLMENT');
    return { global: true, orchestrationId: String(orch.id), status: current === 'FULFILLMENT_PLANNED' ? 'IN_FULFILLMENT' : current, totalFulfillmentOrders: total, deliveredFulfillmentOrders: delivered, settlementReleased: false, completed: false, waiting: true };
  }

  const order = (await tx.query<any>(`select id,status from trust_orders where id=$1 for update`, [input.orderId])).rows[0];
  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (String(order.status) !== 'delivered') {
    if (!['confirmed','processing','shipped'].includes(String(order.status))) throw new Error(`ORDER_DELIVERY_GATE_BLOCKED:${order.status}`);
    await tx.query(`update trust_orders set status='delivered',updated_at=now() where id=$1`, [input.orderId]);
    await tx.query(`insert into trust_order_status_history(order_id,from_status,to_status,source,note) values($1,$2,'delivered','global_fulfillment_execution',$3)`, [input.orderId, order.status, `All ${total} global fulfillment orders delivered`]);
  }

  let settlementReleased = false;
  let releaseId: string | undefined;
  const settlement = await releaseDeliveredSettlementTx(tx, { orderId: input.orderId, idempotencyKey: `global-settlement-release:${input.orderId}` });
  settlementReleased = Boolean(settlement.released || settlement.replay);
  releaseId = settlement.settlementId;
  if (!settlementReleased) {
    await tx.query(`update trust_global_order_execution_runs set status='BLOCKED',error_code='SETTLEMENT_RELEASE_NOT_AVAILABLE',total_fulfillment_orders=$2,delivered_fulfillment_orders=$3,updated_at=now() where id=$1`, [run.id, total, delivered]);
    return { global: true, orchestrationId: String(orch.id), status: 'DELIVERED', totalFulfillmentOrders: total, deliveredFulfillmentOrders: delivered, settlementReleased: false, completed: false, waiting: true };
  }

  const current = String(orch.status) as GlobalOrderOrchestrationStatus;
  if (current === 'FULFILLMENT_PLANNED' || current === 'IN_FULFILLMENT') await moveOrchestration(tx, String(orch.id), current, 'DELIVERED');
  const afterDelivery = (await tx.query<any>(`select status from trust_global_order_orchestrations where id=$1 for update`, [orch.id])).rows[0];
  if (String(afterDelivery.status) === 'DELIVERED') {
    await moveOrchestration(tx, String(orch.id), 'DELIVERED', 'SETTLEMENT_RELEASED');
  }
  await tx.query(`update trust_global_order_orchestrations set settlement_released_at=coalesce(settlement_released_at,now()),updated_at=now() where id=$1`, [orch.id]);
  await moveOrchestration(tx, String(orch.id), 'SETTLEMENT_RELEASED', 'COMPLETED');
  await tx.query(`update trust_global_order_orchestrations set completed_at=now(),updated_at=now() where id=$1`, [orch.id]);
  await tx.query(`update trust_global_order_execution_runs set status='COMPLETED',total_fulfillment_orders=$2,delivered_fulfillment_orders=$3,settlement_release_id=$4,completed_at=now(),updated_at=now() where id=$1`, [run.id, total, delivered, releaseId ?? null]);
  await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('global.order.completed',$1,$2::jsonb) on conflict do nothing`, [input.orderId, JSON.stringify({ orderId: input.orderId, orchestrationId: orch.id, fulfillmentOrderCount: total, settlementReleased: settlementReleased })]);
  return { global: true, orchestrationId: String(orch.id), status: 'COMPLETED', totalFulfillmentOrders: total, deliveredFulfillmentOrders: delivered, settlementReleased, completed: true, replay: false };
}

export async function getGlobalFulfillmentExecutionTx(tx: PoolClient, orderId: string) {
  const row = (await tx.query<any>(`select g.*, count(f.id)::int as total_fulfillment_orders, count(f.id) filter(where f.status='DELIVERED')::int as delivered_fulfillment_orders from trust_global_order_orchestrations g left join trust_marketplace_fulfillment_orders f on f.global_orchestration_id=g.id where g.order_id=$1 group by g.id`, [orderId])).rows[0];
  return row ?? null;
}
