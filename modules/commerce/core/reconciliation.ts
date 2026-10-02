import type { PoolClient } from 'pg';
import { startCapturedOrderKernelTx, resumeCommerceExecutionTx } from './execution-kernel';
import { releaseOrderReservationsTx } from '../inventory/reservations';

export type ReconciliationCandidate = {
  kind: 'CAPTURED_PAYMENT_MISSING_EXECUTION' | 'FULFILLMENT_NEEDS_RESUME' | 'FAILED_PAYMENT_RESERVATION_RELEASE';
  orderId: string;
  paymentId?: string;
  executionRunId?: string;
  paymentStatus?: string;
  orderStatus?: string;
};

export async function findCommerceReconciliationCandidatesTx(tx: PoolClient, limit = 50): Promise<ReconciliationCandidate[]> {
  const captured = await tx.query<any>(`
    select p.id payment_id,p.order_id,p.status payment_status,o.status order_status,r.id execution_run_id
      from trust_payments p
      join trust_orders o on o.id=p.order_id
      left join trust_commerce_execution_runs r on r.order_id=p.order_id
     where p.status='captured'
       and r.id is null
     order by p.updated_at,p.id
     limit $1
     for update of p skip locked`, [limit]);

  const resumable = await tx.query<any>(`
    select r.id execution_run_id,r.order_id,r.status execution_status,o.status order_status
      from trust_commerce_execution_runs r
      join trust_orders o on o.id=r.order_id
     where r.status in ('CAPTURED','BLOCKED','FULFILLMENT_PLANNED','IN_FULFILLMENT')
       and (
         r.status in ('CAPTURED','BLOCKED')
         or exists(select 1 from trust_marketplace_fulfillment_orders f where f.order_id=r.order_id and f.status='DELIVERED')
       )
     order by r.updated_at,r.id
     limit $1
     for update of r skip locked`, [limit]);

  const failed = await tx.query<any>(`
    select p.id payment_id,p.order_id,p.status payment_status,o.status order_status
      from trust_payments p
      join trust_orders o on o.id=p.order_id
     where p.status in ('failed','cancelled')
       and o.status='cancelled'
       and exists(select 1 from trust_inventory_reservations ir where ir.order_id=p.order_id and ir.status='reserved')
     order by p.updated_at,p.id
     limit $1
     for update of p skip locked`, [limit]);

  return [
    ...captured.rows.map(x => ({kind:'CAPTURED_PAYMENT_MISSING_EXECUTION',orderId:String(x.order_id),paymentId:String(x.payment_id),paymentStatus:String(x.payment_status),orderStatus:String(x.order_status)})),
    ...resumable.rows.map(x => ({kind:'FULFILLMENT_NEEDS_RESUME',orderId:String(x.order_id),executionRunId:String(x.execution_run_id),orderStatus:String(x.order_status)})),
    ...failed.rows.map(x => ({kind:'FAILED_PAYMENT_RESERVATION_RELEASE',orderId:String(x.order_id),paymentId:String(x.payment_id),paymentStatus:String(x.payment_status),orderStatus:String(x.order_status)})),
  ];
}

export async function reconcileCommerceCandidateTx(tx: PoolClient, candidate: ReconciliationCandidate, idempotencyKey: string) {
  if (candidate.kind === 'CAPTURED_PAYMENT_MISSING_EXECUTION') {
    if (!candidate.paymentId) throw new Error('RECONCILIATION_PAYMENT_ID_REQUIRED');
    return startCapturedOrderKernelTx(tx, {
      orderId: candidate.orderId,
      paymentId: candidate.paymentId,
      idempotencyKey: `${idempotencyKey}:capture`,
    });
  }
  if (candidate.kind === 'FULFILLMENT_NEEDS_RESUME') {
    return resumeCommerceExecutionTx(tx, {
      orderId: candidate.orderId,
      idempotencyKey: `${idempotencyKey}:resume`,
    });
  }
  await releaseOrderReservationsTx(tx, candidate.orderId, 'PAYMENT_FAILED_RECONCILIATION');
  return {orderId:candidate.orderId,status:'RESERVATIONS_RELEASED',replay:false};
}
