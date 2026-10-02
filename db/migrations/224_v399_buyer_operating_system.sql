-- V399 — Buyer Operating System: one read authority over the customer journey.
-- Read-only view; mutations remain owned by checkout/order/return/payment authorities.
CREATE INDEX IF NOT EXISTS trust_cart_items_cart_idx ON trust_cart_items(cart_id);
CREATE INDEX IF NOT EXISTS trust_returns_customer_status_updated_idx ON trust_returns(customer_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS trust_customer_reviews_customer_created_idx ON trust_customer_reviews(customer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS platform_notifications_recipient_status_created_idx ON platform_notifications(recipient_id,status,created_at DESC);

CREATE OR REPLACE VIEW trust_buyer_operating_snapshot AS
WITH cart_rollup AS (
  SELECT c.customer_id, c.id AS cart_id, count(ci.product_id)::int AS cart_line_count,
         coalesce(sum(ci.quantity),0)::int AS cart_item_count, c.updated_at AS cart_updated_at
  FROM trust_carts c LEFT JOIN trust_cart_items ci ON ci.cart_id=c.id
  GROUP BY c.customer_id,c.id,c.updated_at
), order_rollup AS (
  SELECT o.customer_id,
         count(*)::int AS order_count,
         count(*) FILTER (WHERE o.status IN ('pending','confirmed','processing','shipped'))::int AS active_order_count,
         max(o.created_at) AS last_order_at
  FROM trust_orders o GROUP BY o.customer_id
), return_rollup AS (
  SELECT r.customer_id,count(*)::int AS return_count,
         count(*) FILTER (WHERE r.status NOT IN ('CLOSED','REJECTED','cancelled','completed'))::int AS active_return_count,
         max(r.updated_at) AS last_return_at
  FROM trust_returns r GROUP BY r.customer_id
), notification_rollup AS (
  SELECT recipient_id AS customer_id,count(*)::int AS notification_count,
         count(*) FILTER (WHERE status IN ('QUEUED','SENT','UNREAD'))::int AS unread_notification_count
  FROM platform_notifications GROUP BY recipient_id
), wishlist_rollup AS (
  SELECT customer_id,count(*)::int AS wishlist_count FROM trust_wishlists GROUP BY customer_id
), review_rollup AS (
  SELECT customer_id,count(*)::int AS review_count,
         count(*) FILTER (WHERE status<>'REMOVED')::int AS active_review_count
  FROM trust_customer_reviews GROUP BY customer_id
)
SELECT u.id AS customer_id,
       cr.cart_id AS cart_id,
       coalesce(cr.cart_line_count,0) AS cart_line_count,
       coalesce(cr.cart_item_count,0) AS cart_item_count,
       coalesce(orr.order_count,0) AS order_count,
       coalesce(orr.active_order_count,0) AS active_order_count,
       orr.last_order_at,
       coalesce(rr.return_count,0) AS return_count,
       coalesce(rr.active_return_count,0) AS active_return_count,
       rr.last_return_at,
       coalesce(nr.notification_count,0) AS notification_count,
       coalesce(nr.unread_notification_count,0) AS unread_notification_count,
       coalesce(wr.wishlist_count,0) AS wishlist_count,
       coalesce(rev.review_count,0) AS review_count,
       coalesce(rev.active_review_count,0) AS active_review_count,
       CASE
         WHEN coalesce(rr.active_return_count,0)>0 THEN 'RETURN_ACTIVE'
         WHEN coalesce(orr.active_order_count,0)>0 THEN 'ORDER_ACTIVE'
         WHEN coalesce(cr.cart_item_count,0)>0 THEN 'CART_READY'
         ELSE 'READY'
       END AS buyer_status,
       greatest(cr.cart_updated_at,orr.last_order_at,rr.last_return_at) AS last_activity_at
FROM trust_users u
LEFT JOIN cart_rollup cr ON cr.customer_id=u.id
LEFT JOIN order_rollup orr ON orr.customer_id=u.id
LEFT JOIN return_rollup rr ON rr.customer_id=u.id
LEFT JOIN notification_rollup nr ON nr.customer_id=u.id
LEFT JOIN wishlist_rollup wr ON wr.customer_id=u.id
LEFT JOIN review_rollup rev ON rev.customer_id=u.id
WHERE u.role='customer';
