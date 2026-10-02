import { query } from '../db/postgres';

export type JourneyEvent = {
  at: string;
  domain: 'ORDER' | 'PAYMENT' | 'SELLER_ORDER' | 'FULFILLMENT' | 'SHIPMENT' | 'RETURN' | 'REFUND' | 'PAYOUT' | 'REVENUE';
  type: string;
  referenceId: string | null;
  from: string | null;
  to: string;
  metadata: Record<string, unknown>;
};

function n(value: unknown): number { return Number(value ?? 0); }
function s(value: unknown): string | null { return value == null ? null : String(value); }

export async function getOrderJourney(orderId: string, customerId?: string) {
  const orderResult = await query<any>(
    `select id, customer_id, status, subtotal, discount, shipping, total, currency, payment_method, created_at, updated_at
       from trust_orders
      where id=$1 ${customerId ? 'and customer_id=$2' : ''}`,
    customerId ? [orderId, customerId] : [orderId],
  );
  const order = orderResult.rows[0];
  if (!order) return null;

  const [items, sellerOrders, payments, paymentJobs, paymentLifecycle, fulfillments, allocations, shipments, returns, refunds, refundSettlements, payouts, releases, revenue, orderEvents, sellerEvents, fulfillmentEvents] = await Promise.all([
    query<any>(`select oi.id,oi.product_id,oi.seller_order_id,oi.quantity,oi.unit_price,p.name,p.image from trust_order_items oi join trust_products p on p.id=oi.product_id where oi.order_id=$1 order by oi.created_at asc`, [orderId]),
    query<any>(`select id,merchant_id,seller_order_number,status,subtotal,discount,shipping,total,currency,item_count,created_at,updated_at from trust_seller_orders where order_id=$1 order by created_at asc`, [orderId]),
    query<any>(`select id,provider,payment_intent_id,amount,currency,status,metadata,created_at,updated_at from trust_payments where order_id=$1 order by created_at asc`, [orderId]),
    query<any>(`select j.id,j.kind,j.provider,j.status,j.attempts,j.provider_reference,j.last_error,j.created_at,j.updated_at from trust_payment_provider_jobs j join trust_payments p on p.id=j.payment_id where p.order_id=$1 order by j.created_at asc`, [orderId]),
    query<any>(`select id,global_payment_attempt_id,payment_id,event_type,provider,provider_reference,payload,occurred_at from trust_global_payment_lifecycle_events where order_id=$1 order by occurred_at asc`, [orderId]),
    query<any>(`select id,merchant_id,location_id,program_code,status,item_count,min_days,max_days,destination_region,shipment_id,planned_at,packed_at,handed_off_at,delivered_at,updated_at from trust_marketplace_fulfillment_orders where order_id=$1 order by planned_at asc`, [orderId]),
    query<any>(`select id,fulfillment_order_id,reservation_id,order_item_id,seller_order_id,merchant_id,location_id,offer_id,product_id,quantity,status,allocated_at,picked_at,packed_at,handed_off_at,delivered_at,released_at,updated_at from trust_fulfillment_allocations where fulfillment_order_id in (select id from trust_marketplace_fulfillment_orders where order_id=$1) order by allocated_at asc`, [orderId]),
    query<any>(`select s.id,s.fulfillment_order_id,s.merchant_id,s.carrier,s.service,s.tracking_number,s.status,s.warehouse_id,s.destination,s.eta_at,s.created_at,s.updated_at from trust_shipments s where s.order_id=$1 order by s.created_at asc`, [orderId]),
    query<any>(`select id,status,reason_code,requested_at,approved_at,received_at,inspected_at,closed_at,created_at,updated_at from trust_returns where order_id=$1 order by created_at asc`, [orderId]),
    query<any>(`select r.id,r.payment_id,r.return_id,r.dispute_case_id,r.amount,r.reason,r.status,r.provider_reference,r.idempotency_key,r.created_at,r.updated_at from trust_refunds r join trust_payments p on p.id=r.payment_id where p.order_id=$1 order by r.created_at asc`, [orderId]),
    query<any>(`select rs.id,rs.refund_id,rs.return_id,rs.gross_amount,rs.restocking_fee,rs.shipping_adjustment,rs.net_amount,rs.currency,rs.status,rs.created_at,rs.updated_at from trust_refund_settlements rs join trust_refunds r on r.id=rs.refund_id join trust_payments p on p.id=r.payment_id where p.order_id=$1 order by rs.created_at asc`, [orderId]),
    query<any>(`select pr.id,pr.merchant_id,pr.amount,pr.currency,pr.status,pr.provider,pr.provider_reference,pr.requested_at,pr.processed_at,pr.updated_at from trust_marketplace_payout_requests pr where pr.id in (select distinct a.payout_id from trust_marketplace_payout_eligibility_allocations a join trust_seller_orders so on so.id=a.seller_order_id where so.order_id=$1) order by pr.requested_at asc`, [orderId]),
    query<any>(`select r.id,r.merchant_id,r.seller_order_id,r.order_id,r.amount,r.currency,r.status,r.idempotency_key,r.created_at from trust_marketplace_balance_releases r where r.order_id=$1 order by r.created_at asc`, [orderId]),
    query<any>(`select id,merchant_id,surface,kind,amount,currency,reference_type,reference_id,idempotency_key,created_at from trust_revenue_ledger where order_id=$1 order by created_at asc`, [orderId]),
    query<any>(`select from_status,to_status,source,note,created_at from trust_order_status_history where order_id=$1 order by created_at asc`, [orderId]),
    query<any>(`select e.seller_order_id,e.from_status,e.to_status,e.event_key,e.metadata_json,e.created_at from trust_seller_order_events e join trust_seller_orders so on so.id=e.seller_order_id where so.order_id=$1 order by e.created_at asc`, [orderId]),
    query<any>(`select e.fulfillment_order_id,e.from_status,e.to_status,e.event_key,e.metadata_json,e.created_at from trust_marketplace_fulfillment_events e join trust_marketplace_fulfillment_orders fo on fo.id=e.fulfillment_order_id where fo.order_id=$1 order by e.created_at asc`, [orderId]),
  ]);

  const events: JourneyEvent[] = [];
  for (const r of orderEvents.rows) events.push({ at:r.created_at, domain:'ORDER', type:'STATUS', referenceId:orderId, from:s(r.from_status), to:String(r.to_status), metadata:{source:r.source,note:r.note} });
  for (const r of paymentLifecycle.rows) events.push({ at:r.occurred_at, domain:'PAYMENT', type:r.event_type, referenceId:s(r.payment_id), from:null, to:r.event_type, metadata:{provider:r.provider,providerReference:r.provider_reference} });
  for (const r of sellerEvents.rows) events.push({ at:r.created_at, domain:'SELLER_ORDER', type:'STATUS', referenceId:s(r.seller_order_id), from:s(r.from_status), to:String(r.to_status), metadata:r.metadata_json ?? {} });
  for (const r of fulfillmentEvents.rows) events.push({ at:r.created_at, domain:'FULFILLMENT', type:'STATUS', referenceId:s(r.fulfillment_order_id), from:s(r.from_status), to:String(r.to_status), metadata:r.metadata_json ?? {} });
  for (const r of shipments.rows) events.push({ at:r.updated_at, domain:'SHIPMENT', type:'STATUS', referenceId:s(r.id), from:null, to:String(r.status), metadata:{carrier:r.carrier,trackingNumber:r.tracking_number} });
  for (const r of returns.rows) events.push({ at:r.updated_at, domain:'RETURN', type:'STATUS', referenceId:s(r.id), from:null, to:String(r.status), metadata:{reasonCode:r.reason_code} });
  for (const r of refunds.rows) events.push({ at:r.updated_at, domain:'REFUND', type:'STATUS', referenceId:s(r.id), from:null, to:String(r.status), metadata:{amount:n(r.amount),currency:r.currency} });
  for (const r of payouts.rows) events.push({ at:r.updated_at, domain:'PAYOUT', type:'STATUS', referenceId:s(r.id), from:null, to:String(r.status), metadata:{merchantId:r.merchant_id,amount:n(r.amount),currency:r.currency} });
  for (const r of revenue.rows) events.push({ at:r.created_at, domain:'REVENUE', type:r.kind, referenceId:s(r.id), from:null, to:String(r.surface), metadata:{amount:n(r.amount),currency:r.currency,referenceType:r.reference_type,referenceId:r.reference_id} });
  events.sort((a,b)=>new Date(a.at).getTime()-new Date(b.at).getTime());

  const shipmentStatuses = shipments.rows.map((r:any)=>String(r.status));
  const fulfillmentStatuses = fulfillments.rows.map((r:any)=>String(r.status));
  const paymentStatuses = payments.rows.map((r:any)=>String(r.status));
  const allDelivered = fulfillments.rows.length > 0 && fulfillmentStatuses.every((x:string)=>x==='DELIVERED') && shipmentStatuses.length > 0 && shipmentStatuses.every((x:string)=>x==='DELIVERED');
  const anyException = fulfillmentStatuses.includes('EXCEPTION') || shipmentStatuses.includes('EXCEPTION');
  const allCaptured = paymentStatuses.length > 0 && paymentStatuses.every((x:string)=>x==='captured');
  const anyRefund = refunds.rows.some((r:any)=>['requested','processing','succeeded'].includes(String(r.status)));

  return {
    order: { id:String(order.id), customerId:String(order.customer_id), status:String(order.status), subtotal:n(order.subtotal), discount:n(order.discount), shipping:n(order.shipping), total:n(order.total), currency:String(order.currency), paymentMethod:String(order.payment_method ?? 'cod'), createdAt:order.created_at, updatedAt:order.updated_at },
    summary: { payment: allCaptured ? 'CAPTURED' : paymentStatuses[paymentStatuses.length-1] ?? 'NOT_STARTED', fulfillment: allDelivered ? 'DELIVERED' : anyException ? 'EXCEPTION' : fulfillmentStatuses[fulfillmentStatuses.length-1] ?? 'NOT_STARTED', refund: anyRefund ? 'ACTIVE' : 'NONE', sellerOrderCount:sellerOrders.rows.length, fulfillmentCount:fulfillments.rows.length, shipmentCount:shipments.rows.length, returnCount:returns.rows.length, payoutCount:payouts.rows.length, revenueEntryCount:revenue.rows.length },
    items: items.rows.map((r:any)=>({id:String(r.id),productId:String(r.product_id),sellerOrderId:s(r.seller_order_id),quantity:n(r.quantity),unitPrice:n(r.unit_price),name:r.name,image:r.image})),
    sellerOrders: sellerOrders.rows,
    payments: payments.rows,
    paymentJobs: paymentJobs.rows,
    paymentLifecycle: paymentLifecycle.rows,
    fulfillments: fulfillments.rows,
    allocations: allocations.rows,
    shipments: shipments.rows,
    returns: returns.rows,
    refunds: refunds.rows,
    refundSettlements: refundSettlements.rows,
    payouts: payouts.rows,
    balanceReleases: releases.rows,
    revenue: revenue.rows,
    events,
    source: 'LIVE_POSTGRES_COMMERCE_AUTHORITIES',
  };
}
