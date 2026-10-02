import { query } from '../platform/db/postgres';
import { listShipmentsForOrder } from '../platform/fulfillment-tracking-3';
import { buildOrderTimeline, getOrderActions } from '../platform/order-experience';

const n = (v: unknown) => Number(v ?? 0);

export async function getOrderTracking(orderId: string) {
  const order = (await query<any>(
    `select id,status,subtotal,discount,shipping,total,currency,payment_method,created_at,updated_at
       from trust_orders where id=$1`, [orderId]
  )).rows[0];
  if (!order) throw new Error('ORDER_NOT_FOUND');

  const [items, history, payments, shipments, fulfillments] = await Promise.all([
    query<any>(
      `select oi.id,oi.product_id,oi.offer_id,oi.quantity,oi.unit_price,
              p.name,p.image,
              coalesce(o.merchant_id,p.merchant_id) merchant_id,
              m.store_name,
              o.price offer_price,o.shipping_fee,o.fulfillment_mode,o.delivery_min_days,o.delivery_max_days
         from trust_order_items oi
         join trust_products p on p.id=oi.product_id
         left join trust_marketplace_offers o on o.id=oi.offer_id
         left join trust_merchant_profiles m on m.id=coalesce(o.merchant_id,p.merchant_id)
        where oi.order_id=$1 order by oi.created_at asc,oi.id asc`, [orderId]),
    query<any>(
      `select from_status,to_status,source,note,created_at
         from trust_order_status_history where order_id=$1 order by created_at asc`, [orderId]),
    query<any>(
      `select id,provider,payment_intent_id,amount,currency,status,payment_method,created_at,updated_at
         from trust_payments where order_id=$1 order by created_at asc`, [orderId]),
    listShipmentsForOrder(orderId),
    query<any>(
      `select f.id,f.order_shipment_id,f.merchant_id,m.store_name,f.program_code,f.status,
              f.shipment_id,f.item_count,f.min_days,f.max_days,f.destination_region,
              f.planned_at,f.packed_at,f.handed_off_at,f.delivered_at
         from trust_marketplace_fulfillment_orders f
         left join trust_merchant_profiles m on m.id=f.merchant_id
        where f.order_id=$1 order by f.created_at asc,f.id asc`, [orderId]),
  ]);

  const fulfillmentIds = fulfillments.rows.map((r: any) => r.id);
  const events = fulfillmentIds.length
    ? await query<any>(
      `select e.fulfillment_order_id,e.from_status,e.to_status,e.actor_id,e.metadata_json,e.created_at
         from trust_marketplace_fulfillment_events e
        where e.fulfillment_order_id=any($1::uuid[])
        order by e.created_at asc`, [fulfillmentIds])
    : { rows: [] };

  const eventByFulfillment = new Map<string, any[]>();
  for (const event of events.rows) {
    const list = eventByFulfillment.get(String(event.fulfillment_order_id)) ?? [];
    list.push({
      fromStatus: event.from_status,
      toStatus: event.to_status,
      actorId: event.actor_id ? String(event.actor_id) : null,
      metadata: event.metadata_json ?? {},
      at: event.created_at,
    });
    eventByFulfillment.set(String(event.fulfillment_order_id), list);
  }

  const now = Date.now();
  const activeShipments = shipments.filter((s: any) => !['DELIVERED', 'CANCELLED'].includes(String(s.status)));
  const etaDates = shipments
    .map((s: any) => s.etaAt ?? s.eta_at ?? null)
    .filter(Boolean)
    .map((v: string) => Date.parse(v))
    .filter((v: number) => Number.isFinite(v));

  return {
    order: {
      id: String(order.id), status: String(order.status),
      subtotal: n(order.subtotal), discount: n(order.discount), shipping: n(order.shipping),
      total: n(order.total), currency: String(order.currency), paymentMethod: String(order.payment_method),
      createdAt: order.created_at, updatedAt: order.updated_at,
    },
    items: items.rows.map((r: any) => ({
      id: String(r.id), productId: String(r.product_id), offerId: r.offer_id ? String(r.offer_id) : null,
      quantity: n(r.quantity), unitPrice: n(r.unit_price), name: String(r.name), image: String(r.image ?? ''),
      seller: { id: String(r.merchant_id), storeName: String(r.store_name ?? '') },
      offer: r.offer_id ? {
        price: n(r.offer_price), shippingFee: n(r.shipping_fee), fulfillmentMode: r.fulfillment_mode,
        deliveryMinDays: n(r.delivery_min_days), deliveryMaxDays: n(r.delivery_max_days),
      } : null,
    })),
    payments: payments.rows.map((r: any) => ({ ...r, amount: n(r.amount) })),
    history: history.rows.map((r: any) => ({
      fromStatus: r.from_status, toStatus: r.to_status, source: r.source, note: r.note, at: r.created_at,
    })),
    timeline: buildOrderTimeline(history.rows.map((r: any) => ({ status: r.to_status, createdAt: r.created_at })), String(order.status)),
    actions: getOrderActions(String(order.status)),
    shipments,
    fulfillments: fulfillments.rows.map((r: any) => ({
      id: String(r.id), orderShipmentId: String(r.order_shipment_id), merchantId: String(r.merchant_id),
      storeName: String(r.store_name ?? ''), programCode: String(r.program_code), status: String(r.status),
      shipmentId: r.shipment_id ? String(r.shipment_id) : null, itemCount: n(r.item_count),
      minDays: n(r.min_days), maxDays: n(r.max_days), destinationRegion: String(r.destination_region ?? ''),
      plannedAt: r.planned_at, packedAt: r.packed_at, handedOffAt: r.handed_off_at, deliveredAt: r.delivered_at,
      events: eventByFulfillment.get(String(r.id)) ?? [],
    })),
    summary: {
      activeShipments: activeShipments.length,
      shipmentCount: shipments.length,
      fulfillmentCount: fulfillments.rows.length,
      sellerCount: new Set(items.rows.map((r: any) => String(r.merchant_id))).size,
      etaAt: etaDates.length ? new Date(Math.max(...etaDates)).toISOString() : null,
      overdue: etaDates.some((v: number) => v < now) && activeShipments.length > 0,
    },
    serverAuthoritative: true,
  };
}

export async function getMerchantFulfillmentDetail(fulfillmentOrderId: string, merchantId: string) {
  const fulfillment = (await query<any>(
    `select f.*,m.store_name from trust_marketplace_fulfillment_orders f
       join trust_merchant_profiles m on m.id=f.merchant_id
      where f.id=$1 and f.merchant_id=$2`, [fulfillmentOrderId, merchantId]
  )).rows[0];
  if (!fulfillment) throw new Error('FULFILLMENT_ORDER_NOT_FOUND_OR_NOT_OWNED');

  const [items, shipment, events] = await Promise.all([
    query<any>(
      `select c.offer_id,c.product_id,c.quantity,c.status,p.name,p.image
         from trust_marketplace_fulfillment_custody c
         join trust_products p on p.id=c.product_id
        where c.fulfillment_order_id=$1 order by c.created_at,c.id`, [fulfillmentOrderId]),
    query<any>(
      `select s.id,s.order_id,s.carrier,s.service,s.tracking_number,s.status,s.destination,s.eta_at,s.created_at,s.updated_at
         from trust_shipments s where s.id=$1`, [fulfillment.shipment_id]),
    query<any>(
      `select id,from_status,to_status,actor_id,event_key,metadata_json,created_at
         from trust_marketplace_fulfillment_events where fulfillment_order_id=$1 order by created_at asc`, [fulfillmentOrderId]),
  ]);

  return {
    id: String(fulfillment.id), orderId: String(fulfillment.order_id), orderShipmentId: String(fulfillment.order_shipment_id),
    merchantId: String(fulfillment.merchant_id), storeName: String(fulfillment.store_name), status: String(fulfillment.status),
    programCode: String(fulfillment.program_code), shipmentId: fulfillment.shipment_id ? String(fulfillment.shipment_id) : null,
    itemCount: n(fulfillment.item_count), destinationRegion: String(fulfillment.destination_region ?? ''),
    minDays: n(fulfillment.min_days), maxDays: n(fulfillment.max_days),
    plannedAt: fulfillment.planned_at, packedAt: fulfillment.packed_at, handedOffAt: fulfillment.handed_off_at, deliveredAt: fulfillment.delivered_at,
    items: items.rows.map((r: any) => ({ offerId: r.offer_id ? String(r.offer_id) : null, productId: String(r.product_id), name: String(r.name), image: String(r.image ?? ''), quantity: n(r.quantity), status: String(r.status) })),
    shipment: shipment.rows[0] ? {
      id: String(shipment.rows[0].id), carrier: String(shipment.rows[0].carrier), service: String(shipment.rows[0].service),
      trackingNumber: shipment.rows[0].tracking_number, status: String(shipment.rows[0].status), destination: shipment.rows[0].destination,
      etaAt: shipment.rows[0].eta_at, createdAt: shipment.rows[0].created_at, updatedAt: shipment.rows[0].updated_at,
    } : null,
    events: events.rows.map((r: any) => ({ id: String(r.id), fromStatus: r.from_status, toStatus: r.to_status, actorId: r.actor_id ? String(r.actor_id) : null, eventKey: String(r.event_key), metadata: r.metadata_json ?? {}, at: r.created_at })),
    serverAuthoritative: true,
  };
}
