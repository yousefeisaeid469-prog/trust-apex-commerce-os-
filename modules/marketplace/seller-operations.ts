import type { PoolClient } from 'pg';
import { query, withPgTransaction } from '../platform/db/postgres';
import { createFulfillmentOrderTx, bindFulfillmentShipmentTx } from './fulfillment-runtime';
import { requestPayoutTx } from './financial-loop';

const money = (v: unknown) => Number(Math.max(0, Number(v) || 0).toFixed(2));

export async function ensureSellerOrderFulfillmentTx(tx: PoolClient, input: { sellerOrderId: string; merchantId: string; idempotencyKey: string }) {
  const so = (await tx.query<any>(`select * from trust_seller_orders where id=$1 and merchant_id=$2 for update`, [input.sellerOrderId, input.merchantId])).rows[0];
  if (!so) throw new Error('SELLER_ORDER_NOT_FOUND_OR_NOT_OWNED');

  const existing = (await tx.query<any>(`select f.* from trust_marketplace_fulfillment_orders f where f.seller_order_id=$1 order by f.created_at,f.id limit 1 for update`, [so.id])).rows[0];
  if (existing) return { fulfillmentOrderId: String(existing.id), shipmentId: existing.shipment_id ? String(existing.shipment_id) : null, status: String(existing.status), replay: true };

  const items = (await tx.query<any>(`select oi.offer_id,oi.product_id,oi.quantity from trust_order_items oi where oi.seller_order_id=$1 order by oi.id`, [so.id])).rows;
  if (!items.length) throw new Error('SELLER_ORDER_ITEMS_NOT_FOUND');
  const offerIds = new Set(items.map((x: any) => String(x.offer_id)).filter(Boolean));

  const shipments = (await tx.query<any>(`select * from trust_order_shipments where order_id=$1 and merchant_id=$2 order by created_at,id for update`, [so.order_id, input.merchantId])).rows;
  if (!shipments.length) throw new Error('SELLER_ORDER_SHIPMENT_NOT_FOUND');
  const shipment = shipments.find((s: any) => {
    const ids = Array.isArray(s.offer_ids) ? s.offer_ids.map((x: any) => String(x)) : [];
    return !offerIds.size || ids.some((id: string) => offerIds.has(id));
  }) ?? shipments[0];

  const fulfillment = await createFulfillmentOrderTx(tx, {
    orderShipmentId: String(shipment.id),
    merchantId: input.merchantId,
    idempotencyKey: `${input.idempotencyKey}:fulfillment:${shipment.id}`,
    sellerOrderId: String(so.id),
  });
  const shipmentRow = (await tx.query<any>(`select id from trust_shipments where order_id=$1 and carrier=$2 and service='MARKETPLACE' order by created_at,id limit 1 for update`, [so.order_id, `TRUST_${String(shipment.source)}`])).rows[0];
  if (shipmentRow) {
    await bindFulfillmentShipmentTx(tx, { fulfillmentOrderId: String(fulfillment.id), merchantId: input.merchantId, shipmentId: String(shipmentRow.id), idempotencyKey: `${input.idempotencyKey}:bind:${shipment.id}` });
  }
  return { fulfillmentOrderId: String(fulfillment.id), shipmentId: shipmentRow ? String(shipmentRow.id) : null, status: String(fulfillment.status), replay: false };
}

export async function syncSellerOrderFinancialTx(tx: PoolClient, sellerOrderId: string) {
  const so = (await tx.query<any>(`select * from trust_seller_orders where id=$1 for update`, [sellerOrderId])).rows[0];
  if (!so) throw new Error('SELLER_ORDER_NOT_FOUND');
  const settlement = (await tx.query<any>(`select s.id,s.payment_id,s.currency from trust_marketplace_payment_settlements s where s.order_id=$1 order by s.created_at desc limit 1 for update`, [so.order_id])).rows[0];
  if (!settlement) return { status: 'PENDING', sellerOrderId: String(so.id), releasedAmount: 0, replay: false };
  const credit = (await tx.query<any>(`select coalesce(sum(amount),0)::numeric amount from trust_marketplace_payment_ledger where payment_id=$1 and merchant_id=$2 and entry_type='SELLER_CREDIT' and direction='CREDIT'`, [settlement.payment_id, so.merchant_id])).rows[0];
  const released = (await tx.query<any>(`select coalesce(sum(amount),0)::numeric amount from trust_marketplace_balance_releases where order_id=$1 and merchant_id=$2 and status='RELEASED'`, [so.order_id, so.merchant_id])).rows[0];
  const sellerCredit = money(credit?.amount);
  const releasedAmount = money(released?.amount);
  const status = releasedAmount > 0 ? 'RELEASED' : 'PENDING';
  await tx.query(`insert into trust_seller_order_financials(seller_order_id,merchant_id,settlement_id,payment_id,gross_amount,seller_credit_amount,released_amount,currency,status) values($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict(seller_order_id) do update set settlement_id=excluded.settlement_id,payment_id=excluded.payment_id,gross_amount=excluded.gross_amount,seller_credit_amount=excluded.seller_credit_amount,released_amount=excluded.released_amount,currency=excluded.currency,status=case when trust_seller_order_financials.status='PAID' then 'PAID' else excluded.status end,updated_at=now()`, [so.id, so.merchant_id, settlement.id, settlement.payment_id, so.total, sellerCredit, releasedAmount, settlement.currency, status]);
  return { sellerOrderId: String(so.id), settlementId: String(settlement.id), sellerCreditAmount: sellerCredit, releasedAmount, currency: String(settlement.currency), status, replay: false };
}

export async function getSellerOrderOperationsForMerchant(merchantId: string, sellerOrderId: string) {
  const result = await withPgTransaction(async tx => {
    const so = (await tx.query<any>(`select so.* from trust_seller_orders so where so.id=$1 and so.merchant_id=$2`, [sellerOrderId, merchantId])).rows[0];
    if (!so) throw new Error('SELLER_ORDER_NOT_FOUND_OR_NOT_OWNED');
    await syncSellerOrderFinancialTx(tx, sellerOrderId);
    const [fulfillment, financial, payout] = await Promise.all([
      tx.query<any>(`select f.id,f.order_shipment_id,f.status,f.program_code,f.shipment_id,f.item_count,f.min_days,f.max_days,f.destination_region,f.planned_at,f.packed_at,f.handed_off_at,f.delivered_at,s.status shipment_status,s.tracking_number,s.carrier,s.service,s.eta_at from trust_marketplace_fulfillment_orders f left join trust_shipments s on s.id=f.shipment_id where f.seller_order_id=$1 order by f.created_at,f.id`, [sellerOrderId]),
      tx.query<any>(`select * from trust_seller_order_financials where seller_order_id=$1`, [sellerOrderId]),
      tx.query<any>(`select p.id,p.amount,p.currency,p.status,p.provider,p.provider_reference,p.requested_at,p.processed_at,a.amount allocated_amount from trust_marketplace_payout_requests p left join trust_seller_order_payout_allocations a on a.payout_id=p.id where p.seller_order_id=$1 order by p.requested_at desc`, [sellerOrderId]),
    ]);
    return { sellerOrder: so, fulfillmentOrders: fulfillment.rows, financial: financial.rows[0] ?? null, payouts: payout.rows };
  });
  return result;
}

export async function requestSellerOrderPayoutTx(tx: PoolClient, input: { merchantId: string; sellerOrderId: string; amount: number; currency?: string; provider?: string; idempotencyKey: string }) {
  const so = (await tx.query<any>(`select * from trust_seller_orders where id=$1 and merchant_id=$2 for update`, [input.sellerOrderId, input.merchantId])).rows[0];
  if (!so) throw new Error('SELLER_ORDER_NOT_FOUND_OR_NOT_OWNED');
  if (so.status !== 'DELIVERED') throw new Error('SELLER_ORDER_NOT_DELIVERED');
  const financial = await syncSellerOrderFinancialTx(tx, input.sellerOrderId);
  if (financial.status !== 'RELEASED' && financial.status !== 'PAID') throw new Error('SELLER_ORDER_FUNDS_NOT_RELEASED');
  const allocated = (await tx.query<any>(`select coalesce(sum(amount),0)::numeric amount from trust_seller_order_payout_allocations where seller_order_id=$1`, [input.sellerOrderId])).rows[0];
  const availableForOrder = money(financial.releasedAmount - Number(allocated?.amount || 0));
  if (money(input.amount) > availableForOrder) throw new Error('SELLER_ORDER_PAYOUT_EXCEEDS_RELEASED_AMOUNT');
  const payout = await requestPayoutTx(tx, { merchantId: input.merchantId, amount: input.amount, currency: input.currency, provider: input.provider, idempotencyKey: input.idempotencyKey });
  await tx.query(`update trust_marketplace_payout_requests set seller_order_id=$2 where id=$1`, [payout.payoutId, input.sellerOrderId]);
  await tx.query(`insert into trust_seller_order_payout_allocations(seller_order_id,payout_id,merchant_id,amount,currency) values($1,$2,$3,$4,$5)`, [input.sellerOrderId, payout.payoutId, input.merchantId, input.amount, input.currency ?? financial.currency]);
  await tx.query(`update trust_seller_order_financials set status='PAYOUT_HELD',updated_at=now() where seller_order_id=$1 and status<>'PAID'`, [input.sellerOrderId]);
  return { ...payout, sellerOrderId: input.sellerOrderId, allocatedAmount: money(input.amount) };
}
