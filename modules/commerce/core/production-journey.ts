import type { PoolClient } from 'pg';
import { createHash } from 'crypto';
import { createFulfillmentOrderTx, bindFulfillmentShipmentTx } from '../../marketplace/fulfillment-runtime.ts';
import { settleCapturedPaymentTx } from '../../marketplace/economic-settlement.ts';

const money = (value: unknown) => Number(Math.max(0, Number(value) || 0).toFixed(2));
const hash = (scope: string, key: string) => createHash('sha256').update(`${scope}:${key}`).digest('hex');

export type JourneyAction = 'PREPARE_FULFILLMENT' | 'CAPTURE_COD';

async function ensureShipmentTx(tx: PoolClient, order: any, shipment: any) {
  const existing = (await tx.query<any>(
    `select * from trust_shipments where order_id=$1 and carrier=$2 and service=$3 order by created_at,id limit 1 for update`,
    [order.id, `TRUST_${String(shipment.source)}`, 'MARKETPLACE']
  )).rows[0];
  if (existing) return existing;

  const destination = {
    country: order.destination_country ?? 'GLOBAL',
    region: shipment.destination_region,
    address: order.guest_address ?? null,
  };
  const trackingNumber = `TRUST-${String(order.id).replace(/-/g, '').slice(0, 12)}-${String(shipment.id).replace(/-/g, '').slice(0, 8)}`;
  const inserted = (await tx.query<any>(
    `insert into trust_shipments(id,order_id,carrier,service,tracking_number,status,warehouse_id,destination,eta_at)
     values(gen_random_uuid(),$1,$2,$3,$4,'PLANNED',$5,$6::jsonb,now()+($7::text || ' days')::interval)
     returning *`,
    [order.id, `TRUST_${String(shipment.source)}`, 'MARKETPLACE', trackingNumber, shipment.location_id ?? null, JSON.stringify(destination), Number(shipment.max_days ?? 3)]
  )).rows[0];
  if (!inserted) throw new Error('SHIPMENT_CREATE_FAILED');

  const eventId = hash('shipment.planned', String(inserted.id));
  await tx.query(
    `insert into trust_shipment_tracking_events(id,shipment_id,event_type,status,occurred_at,description)
     values($1,$2,'STATUS','PLANNED',now(),'Shipment planned by commerce journey') on conflict(id) do nothing`,
    [eventId, inserted.id]
  );
  return inserted;
}

export async function prepareOrderFulfillmentTx(tx: PoolClient, input: { orderId: string; idempotencyKey: string }) {
  const prior = (await tx.query<any>(
    `select id,status from trust_marketplace_fulfillment_orders where order_id=$1 order by created_at,id`,
    [input.orderId]
  )).rows;
  const order = (await tx.query<any>(
    `select id,status,payment_method,destination_country,guest_address,currency,total from trust_orders where id=$1 for update`,
    [input.orderId]
  )).rows[0];
  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (!['confirmed','processing','shipped','delivered'].includes(String(order.status))) throw new Error(`ORDER_NOT_FULFILLABLE:${order.status}`);

  const shipments = (await tx.query<any>(
    `select * from trust_order_shipments where order_id=$1 order by created_at,id for update`,
    [input.orderId]
  )).rows;
  if (!shipments.length) throw new Error('ORDER_SHIPMENT_PLAN_MISSING');

  const created: any[] = [];
  for (const shipment of shipments) {
    const sellerOrder = (await tx.query<any>(
      `select id from trust_seller_orders where order_id=$1 and merchant_id=$2 for update`,
      [order.id, shipment.merchant_id]
    )).rows[0];
    const fulfillment = await createFulfillmentOrderTx(tx, {
      orderShipmentId: String(shipment.id),
      merchantId: String(shipment.merchant_id),
      sellerOrderId: sellerOrder?.id ? String(sellerOrder.id) : undefined,
      idempotencyKey: `${input.idempotencyKey}:fulfillment:${shipment.id}`,
    });
    const shipmentRow = await ensureShipmentTx(tx, order, shipment);
    await bindFulfillmentShipmentTx(tx, {
      fulfillmentOrderId: String(fulfillment.id),
      merchantId: String(shipment.merchant_id),
      shipmentId: String(shipmentRow.id),
      idempotencyKey: `${input.idempotencyKey}:bind:${shipment.id}`,
    });
    created.push({
      fulfillmentOrderId: String(fulfillment.id),
      shipmentId: String(shipmentRow.id),
      merchantId: String(shipment.merchant_id),
      status: String(fulfillment.status),
    });
  }

  if (order.status === 'confirmed') {
    await tx.query(`update trust_orders set status='processing',updated_at=now() where id=$1`, [order.id]);
    await tx.query(
      `insert into trust_order_status_history(order_id,from_status,to_status,source,note)
       values($1,'confirmed','processing','commerce_journey','Fulfillment prepared')`,
      [order.id]
    );
  }

  await tx.query(
    `insert into trust_outbox_events(event_type,aggregate_id,payload_json)
     values('commerce.fulfillment.prepared',$1,$2::jsonb) on conflict do nothing`,
    [order.id, JSON.stringify({ orderId: order.id, fulfillmentOrders: created })]
  );
  return { orderId: String(order.id), status: order.status === 'confirmed' ? 'processing' : order.status, fulfillmentOrders: created, replay: prior.length > 0 };
}

export async function captureCodAtDeliveryTx(tx: PoolClient, input: { orderId: string; idempotencyKey: string; collectorReference?: string }) {
  const order = (await tx.query<any>(
    `select id,status,payment_method,total,currency,customer_id from trust_orders where id=$1 for update`,
    [input.orderId]
  )).rows[0];
  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (order.payment_method !== 'cod') throw new Error('ORDER_IS_NOT_COD');
  if (order.status !== 'delivered') throw new Error('COD_COLLECTION_REQUIRES_DELIVERED_ORDER');

  const amount = money(order.total);
  const key = `cod:${input.idempotencyKey}`;
  const existing = (await tx.query<any>(`select * from trust_cod_collections where order_id=$1 for update`, [order.id])).rows[0];
  if (existing?.status === 'COLLECTED') return { collectionId: String(existing.id), paymentId: existing.payment_id ? String(existing.payment_id) : null, status: 'COLLECTED', amount: Number(existing.amount), replay: true };

  const paymentIntentId = `cod_${order.id}`;
  const payment = (await tx.query<any>(
    `insert into trust_payments(order_id,provider,payment_intent_id,amount,currency,status,idempotency_key,payment_method,metadata)
     values($1,'cod',$2,$3,$4,'captured',$5,'cod',$6::jsonb)
     on conflict(order_id, payment_method, idempotency_key) do nothing
     returning id`,
    [order.id, paymentIntentId, amount, order.currency, key, JSON.stringify({ source: 'delivery_collection', collectorReference: input.collectorReference ?? null })]
  )).rows[0];
  let paymentId = payment?.id;
  if (!paymentId) {
    const priorPayment = (await tx.query<any>(`select id,status,amount,currency from trust_payments where provider='cod' and payment_intent_id=$1 for update`, [paymentIntentId])).rows[0];
    if (!priorPayment || priorPayment.status !== 'captured' || money(priorPayment.amount) !== amount) throw new Error('COD_PAYMENT_CONFLICT');
    paymentId = priorPayment.id;
  }

  const collection = (await tx.query<any>(
    `insert into trust_cod_collections(order_id,payment_id,amount,currency,status,collected_at,collector_reference,idempotency_key,metadata_json)
     values($1,$2,$3,$4,'COLLECTED',now(),$5,$6,$7::jsonb)
     on conflict(order_id) do update set payment_id=excluded.payment_id,status='COLLECTED',collected_at=coalesce(trust_cod_collections.collected_at,now()),collector_reference=coalesce(excluded.collector_reference,trust_cod_collections.collector_reference),updated_at=now()
     returning id`,
    [order.id, paymentId, amount, order.currency, input.collectorReference ?? null, key, JSON.stringify({ source: 'delivery_collection' })]
  )).rows[0];

  const settlement = await settleCapturedPaymentTx(tx, {
    paymentId: String(paymentId),
    orderId: String(order.id),
    idempotencyKey: `cod-settlement:${order.id}`,
  });

  await tx.query(
    `insert into trust_payment_events(provider,provider_event_id,payment_intent_id,status,payload_json)
     values('cod',$1,$2,'captured',$3::jsonb) on conflict(provider,provider_event_id) do nothing`,
    [`cod-capture:${order.id}`, paymentIntentId, JSON.stringify({ orderId: order.id, amount, collectorReference: input.collectorReference ?? null })]
  );
  await tx.query(
    `insert into trust_outbox_events(event_type,aggregate_id,payload_json)
     values('commerce.cod.collected',$1,$2::jsonb) on conflict do nothing`,
    [order.id, JSON.stringify({ orderId: order.id, paymentId, collectionId: collection.id, settlementId: settlement.settlementId, amount })]
  );
  return { collectionId: String(collection.id), paymentId: String(paymentId), settlementId: String(settlement.settlementId), status: 'COLLECTED', amount, replay: false };
}

export async function getCommerceJourneyTx(tx: PoolClient, orderId: string) {
  const order = (await tx.query<any>(`select * from trust_orders where id=$1`, [orderId])).rows[0];
  if (!order) return null;
  const [payments, items, shipments, fulfillment, settlement, cod, revenue] = await Promise.all([
    tx.query<any>(`select id,provider,payment_intent_id,amount,currency,status,payment_method,created_at,updated_at from trust_payments where order_id=$1 order by created_at asc`, [orderId]),
    tx.query<any>(`select oi.id,oi.product_id,oi.offer_id,oi.quantity,oi.unit_price,coalesce(o.merchant_id,p.merchant_id) merchant_id from trust_order_items oi join trust_products p on p.id=oi.product_id left join trust_marketplace_offers o on o.id=oi.offer_id where oi.order_id=$1 order by oi.id`, [orderId]),
    tx.query<any>(`select s.id,s.merchant_id,s.destination_region,s.min_days,s.max_days,s.shipping_cost,s.fulfillment_cost,s.source,sh.id shipment_id,sh.carrier,sh.service,sh.tracking_number,sh.status shipment_status from trust_order_shipments s left join trust_shipments sh on sh.order_id=s.order_id where s.order_id=$1 order by s.created_at,s.id`, [orderId]),
    tx.query<any>(`select f.id,f.order_shipment_id,f.merchant_id,f.program_code,f.status,f.shipment_id,f.item_count,f.min_days,f.max_days,f.destination_region,f.planned_at,f.packed_at,f.handed_off_at,f.delivered_at from trust_marketplace_fulfillment_orders f where f.order_id=$1 order by f.created_at,f.id`, [orderId]),
    tx.query<any>(`select id,payment_id,gross_amount,merchandise_gross,seller_net,platform_fee,payment_fee,fulfillment_fee,return_fee,currency,status,created_at,released_at,delivered_at from trust_marketplace_payment_settlements where order_id=$1 order by created_at desc limit 1`, [orderId]),
    tx.query<any>(`select id,payment_id,amount,currency,status,collected_at,collector_reference,created_at from trust_cod_collections where order_id=$1`, [orderId]),
    tx.query<any>(`select surface,kind,sum(amount)::numeric amount,currency from trust_revenue_ledger where order_id=$1 group by surface,kind,currency order by surface,kind`, [orderId]),
  ]);
  return {
    order: { id: String(order.id), status: String(order.status), paymentMethod: String(order.payment_method), subtotal: money(order.subtotal), discount: money(order.discount), shipping: money(order.shipping), total: money(order.total), currency: String(order.currency) },
    items: items.rows,
    payments: payments.rows,
    shipments: shipments.rows,
    fulfillmentOrders: fulfillment.rows,
    settlement: settlement.rows[0] ?? null,
    codCollection: cod.rows[0] ?? null,
    revenue: revenue.rows,
  };
}
