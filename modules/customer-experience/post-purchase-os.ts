import { query } from '../platform/db/postgres';

export async function getPostPurchaseOverview(customerId: string) {
  const [orders, returns, reviews, loyalty, notifications] = await Promise.all([
    query(`select id,status,total,currency,created_at as "createdAt",updated_at as "updatedAt" from trust_orders where customer_id=$1 order by created_at desc limit 25`, [customerId]),
    query(`select id,order_id as "orderId",status,reason_code as "reasonCode",requested_at as "requestedAt",updated_at as "updatedAt" from trust_returns where customer_id=$1 order by created_at desc limit 25`, [customerId]),
    query(`select id,product_id as "productId",order_id as "orderId",rating,status,verified_purchase as "verifiedPurchase",created_at as "createdAt" from trust_customer_reviews where customer_id=$1 order by created_at desc limit 25`, [customerId]),
    query(`select customer_id as "customerId",tier,points,lifetime_points as "lifetimePoints",updated_at as "updatedAt" from trust_marketplace_loyalty_accounts where customer_id=$1`, [customerId]),
    query(`select id,topic,title,body,status,read_at as "readAt",created_at as "createdAt" from platform_notifications where recipient_id=$1 order by created_at desc limit 25`, [customerId]),
  ]);
  return {
    surfaceStatus: 'LIVE',
    orders: orders.rows,
    returns: returns.rows,
    reviews: reviews.rows,
    loyalty: loyalty.rows[0] ?? null,
    notifications: notifications.rows,
  };
}

export async function getReviewEligibility(customerId: string, productId: string) {
  const r = await query(`
    select oi.id as "orderItemId",o.id as "orderId",o.status,o.created_at as "orderedAt",
           exists(select 1 from trust_customer_reviews r where r.customer_id=$1 and r.product_id=$2 and r.order_id=o.id and r.status<>'REMOVED') as "alreadyReviewed"
    from trust_orders o join trust_order_items oi on oi.order_id=o.id
    where o.customer_id=$1 and oi.product_id=$2 and o.status='delivered'
    order by o.created_at desc limit 20`, [customerId, productId]);
  const eligible = r.rows.find((row: any) => !row.alreadyReviewed);
  return { eligible: Boolean(eligible), order: eligible ?? null, candidates: r.rows };
}

export async function getLoyaltyEligibility(customerId: string, orderId: string) {
  const r = await query(`select id,status,subtotal,total,currency from trust_orders where id=$1 and customer_id=$2`, [orderId, customerId]);
  if (!r.rows[0]) throw new Error('ORDER_NOT_FOUND');
  const order = r.rows[0];
  const existing = await query(`select id,points,reason,created_at as "createdAt" from trust_marketplace_loyalty_ledger where customer_id=$1 and idempotency_key=$2`, [customerId, `delivery-loyalty:${orderId}`]);
  const points = Math.max(0, Math.floor(Number(order.subtotal ?? 0) / 100));
  return { eligible: order.status === 'delivered' && points > 0 && !existing.rows[0], points, order, awarded: existing.rows[0] ?? null };
}
