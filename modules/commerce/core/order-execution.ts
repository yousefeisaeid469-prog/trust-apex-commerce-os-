import type { PoolClient } from 'pg';
import { prepareOrderFulfillmentTx } from './production-journey';
import { transitionFulfillmentOrderTx } from '../../marketplace/fulfillment-runtime';
import { releaseDeliveredSettlementTx } from '../../marketplace/financial-loop';
import { consumeOrderReservationsTx } from '../inventory/reservations';
import { enqueueCommerceExecutionJobTx } from './execution-worker';
import { enqueueTransactionalOutboxTx } from '../../platform/transaction-consistency';
import { ensureOrderRuntimeOperationTx, transitionRuntimeOperationTx } from '../../platform/runtime-spine';

export type CommerceExecutionStatus = import('./lifecycle-contract').CommerceLifecycleStatus;
import { assertCommerceLifecycleMove } from './lifecycle-contract';

async function move(tx: PoolClient, runId: string, from: CommerceExecutionStatus, to: CommerceExecutionStatus, errorCode?: string | null) {
  assertCommerceLifecycleMove(from, to);
  await tx.query(`update trust_commerce_execution_runs set status=$2,last_error_code=$3,updated_at=now() where id=$1`, [runId,to,errorCode??null]);
}

/**
 * Called inside the same transaction as a successful payment capture.
 * It makes standard marketplace orders operational immediately: fulfillment
 * orders and shipment records are created before the transaction commits.
 */
export async function startCapturedOrderExecutionTx(tx: PoolClient, input:{orderId:string;paymentId:string;idempotencyKey:string}) {
  const order = (await tx.query<any>(`select id,status,payment_method from trust_orders where id=$1 for update`,[input.orderId])).rows[0];
  if (!order) throw new Error('ORDER_NOT_FOUND');
  const existing = (await tx.query<any>(`select * from trust_commerce_execution_runs where order_id=$1 for update`,[input.orderId])).rows[0];
  if (existing?.status === 'COMPLETED' || existing?.status === 'REFUNDED') return {...existing,replay:true};

  const run = existing ?? (await tx.query<any>(`insert into trust_commerce_execution_runs(order_id,payment_id,status) values($1,$2,'CAPTURED') returning *`,[input.orderId,input.paymentId])).rows[0];
  const runtime=await ensureOrderRuntimeOperationTx(tx,input.orderId,{correlationId:input.idempotencyKey,metadata:{source:'commerce.execution',paymentId:input.paymentId}});
  await transitionRuntimeOperationTx(tx,runtime.operationId,'RUNNING',{eventType:'commerce.execution.started',payload:{executionId:String(run.id),paymentId:input.paymentId}});
  if (!run) throw new Error('COMMERCE_EXECUTION_CREATE_FAILED');

  const consumedReservations = await consumeOrderReservationsTx(tx, input.orderId);
  const prepared = await prepareOrderFulfillmentTx(tx,{orderId:input.orderId,idempotencyKey:`${input.idempotencyKey}:fulfillment`});
  const count = Number(prepared.fulfillmentOrders?.length ?? 0);
  if (count < 1) {
    await move(tx,String(run.id),String(run.status) as CommerceExecutionStatus,'BLOCKED','FULFILLMENT_ORDER_COUNT_ZERO');
    await transitionRuntimeOperationTx(tx,runtime.operationId,'WAITING',{eventType:'commerce.execution.waiting',errorCode:'FULFILLMENT_ORDER_COUNT_ZERO',payload:{executionId:String(run.id)}});
    return {executionId:String(run.id),status:'BLOCKED',fulfillmentOrderCount:0,deliveredFulfillmentOrderCount:0,replay:false};
  }
  const current = String(run.status) as CommerceExecutionStatus;
  if (current === 'CAPTURED' || current === 'BLOCKED') await move(tx,String(run.id),current,'FULFILLMENT_PLANNED');
  await tx.query(`update trust_commerce_execution_runs set payment_id=$2,fulfillment_order_count=$3,last_error_code=null,updated_at=now() where id=$1`,[run.id,input.paymentId,count]);
  await transitionRuntimeOperationTx(tx,runtime.operationId,'RUNNING',{eventType:'commerce.fulfillment.planned',payload:{executionId:String(run.id),fulfillmentOrderCount:count}});
  await enqueueTransactionalOutboxTx(tx,{eventType:'commerce.order.execution.started',aggregateId:input.orderId,eventKey:`order-execution-started:${run.id}`,payload:{orderId:input.orderId,paymentId:input.paymentId,executionId:run.id,fulfillmentOrderCount:count}});
  await enqueueCommerceExecutionJobTx(tx,{orderId:input.orderId,executionRunId:String(run.id),idempotencyKey:`commerce-execution:${input.orderId}:initial`});
  return {executionId:String(run.id),status:'FULFILLMENT_PLANNED',fulfillmentOrderCount:count,deliveredFulfillmentOrderCount:0,reservationsConsumed:consumedReservations.consumed,replay:false};
}

/** Called after a standard shipment becomes DELIVERED. */
export async function completeDeliveredOrderExecutionTx(tx: PoolClient,input:{orderId:string;shipmentId:string;triggerKey:string}) {
  const run = (await tx.query<any>(`select * from trust_commerce_execution_runs where order_id=$1 for update`,[input.orderId])).rows[0];
  if (!run) return {managed:false};
  const runtime=await ensureOrderRuntimeOperationTx(tx,input.orderId,{correlationId:input.triggerKey,metadata:{source:'commerce.delivery',shipmentId:input.shipmentId}});
  if (['COMPLETED','REFUNDED'].includes(String(run.status))) return {managed:true,replay:true,status:String(run.status)};

  const fulfillmentRows = (await tx.query<any>(`select f.*,s.status shipment_status from trust_marketplace_fulfillment_orders f left join trust_shipments s on s.id=f.shipment_id where f.order_id=$1 order by f.created_at,f.id for update`,[input.orderId])).rows;
  if (!fulfillmentRows.length) {
    await move(tx,String(run.id),String(run.status) as CommerceExecutionStatus,'BLOCKED','FULFILLMENT_ORDERS_MISSING');
    await transitionRuntimeOperationTx(tx,runtime.operationId,'WAITING',{eventType:'commerce.delivery.waiting',errorCode:'FULFILLMENT_ORDERS_MISSING',payload:{executionId:String(run.id)}});
    return {managed:true,status:'BLOCKED',completed:false};
  }
  for (const f of fulfillmentRows) {
    if (String(f.shipment_status)==='DELIVERED' && String(f.status)!=='DELIVERED') {
      await transitionFulfillmentOrderTx(tx,{fulfillmentOrderId:String(f.id),merchantId:String(f.merchant_id),toStatus:'DELIVERED',idempotencyKey:`commerce-delivery:${input.shipmentId}:${f.id}`});
    }
  }
  const counts=(await tx.query<any>(`select count(*)::int total,count(*) filter(where status='DELIVERED')::int delivered from trust_marketplace_fulfillment_orders where order_id=$1`,[input.orderId])).rows[0];
  const total=Number(counts.total||0), delivered=Number(counts.delivered||0);
  await tx.query(`update trust_commerce_execution_runs set fulfillment_order_count=$2,delivered_fulfillment_order_count=$3,last_delivery_at=now(),updated_at=now() where id=$1`,[run.id,total,delivered]);
  if (delivered < total) {
    const current=String(run.status) as CommerceExecutionStatus;
    if (current==='FULFILLMENT_PLANNED') await move(tx,String(run.id),current,'IN_FULFILLMENT');
    await transitionRuntimeOperationTx(tx,runtime.operationId,'RUNNING',{eventType:'commerce.delivery.partial',payload:{total,delivered}});
    return {managed:true,status:current==='FULFILLMENT_PLANNED'?'IN_FULFILLMENT':current,total,delivered,completed:false};
  }

  const order=(await tx.query<any>(`select id,status from trust_orders where id=$1 for update`,[input.orderId])).rows[0];
  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (String(order.status)!=='delivered') {
    if (!['confirmed','processing','shipped'].includes(String(order.status))) throw new Error(`ORDER_DELIVERY_GATE_BLOCKED:${order.status}`);
    await tx.query(`update trust_orders set status='delivered',updated_at=now() where id=$1`,[input.orderId]);
    await tx.query(`insert into trust_order_status_history(order_id,from_status,to_status,source,note) values($1,$2,'delivered','commerce_execution',$3)`,[input.orderId,order.status,'All fulfillment shipments delivered']);
  }
  const settlement=await releaseDeliveredSettlementTx(tx,{orderId:input.orderId,idempotencyKey:`commerce-settlement-release:${input.orderId}`});
  if (!settlement.released && !settlement.replay) {
    await move(tx,String(run.id),String(run.status) as CommerceExecutionStatus,'BLOCKED','SETTLEMENT_RELEASE_NOT_AVAILABLE');
    await transitionRuntimeOperationTx(tx,runtime.operationId,'WAITING',{eventType:'commerce.settlement.waiting',errorCode:'SETTLEMENT_RELEASE_NOT_AVAILABLE',payload:{executionId:String(run.id)}});
    return {managed:true,status:'BLOCKED',total,delivered,completed:false};
  }
  const current=String(run.status) as CommerceExecutionStatus;
  if (current==='FULFILLMENT_PLANNED'||current==='IN_FULFILLMENT') await move(tx,String(run.id),current,'DELIVERED');
  await move(tx,String(run.id),'DELIVERED','SETTLEMENT_RELEASED');
  await tx.query(`update trust_commerce_execution_runs set settlement_id=$2,settlement_released_at=coalesce(settlement_released_at,now()),updated_at=now() where id=$1`,[run.id,settlement.settlementId]);
  await move(tx,String(run.id),'SETTLEMENT_RELEASED','COMPLETED');
  await tx.query(`update trust_commerce_execution_runs set completed_at=coalesce(completed_at,now()),updated_at=now() where id=$1`,[run.id]);
  await transitionRuntimeOperationTx(tx,runtime.operationId,'SUCCEEDED',{eventType:'commerce.order.completed',payload:{orderId:input.orderId,executionId:String(run.id),fulfillmentOrderCount:total,settlementReleased:true}});
  await enqueueTransactionalOutboxTx(tx,{eventType:'commerce.order.completed',aggregateId:input.orderId,eventKey:`order-completed:${run.id}`,payload:{orderId:input.orderId,executionId:run.id,fulfillmentOrderCount:total,settlementReleased:true}});
  return {managed:true,status:'COMPLETED',total,delivered,settlementReleased:true,completed:true,replay:false};
}

export async function getCommerceExecutionTx(tx:PoolClient,orderId:string) {
  const row=(await tx.query<any>(`select * from trust_commerce_execution_runs where order_id=$1`,[orderId])).rows[0];
  return row ?? null;
}
