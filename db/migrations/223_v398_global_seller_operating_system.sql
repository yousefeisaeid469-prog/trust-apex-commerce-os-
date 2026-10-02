-- V398 — Global Seller Operating System.
-- Canonical seller-facing read model joining catalog, merchant inventory,
-- seller orders, fulfillment and financial truth. Read-only by design: every
-- mutation remains owned by its existing transactional authority.
CREATE INDEX IF NOT EXISTS trust_seller_orders_merchant_updated_idx
  ON trust_seller_orders(merchant_id,updated_at DESC,id);
CREATE INDEX IF NOT EXISTS trust_products_merchant_stock_idx
  ON trust_products(merchant_id,stock,updated_at DESC);
CREATE INDEX IF NOT EXISTS trust_marketplace_fulfillment_orders_seller_status_idx
  ON trust_marketplace_fulfillment_orders(seller_order_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS trust_merchant_inventory_balances_merchant_updated_idx
  ON trust_merchant_inventory_balances(merchant_id,updated_at DESC);

CREATE OR REPLACE VIEW trust_global_seller_operating_truth AS
WITH catalog AS (
  SELECT merchant_id,
    count(*)::int product_count,
    count(*) FILTER (WHERE active)::int active_product_count,
    count(*) FILTER (WHERE stock=0)::int catalog_out_of_stock,
    count(*) FILTER (WHERE stock>0 AND stock<=10)::int catalog_low_stock,
    coalesce(sum(stock),0)::numeric catalog_stock_units
  FROM trust_products
  GROUP BY merchant_id
),
merchant_inventory AS (
  SELECT merchant_id,
    count(*)::int inventory_sku_count,
    count(*) FILTER (WHERE on_hand-reserved<=0)::int inventory_out_of_stock,
    count(*) FILTER (WHERE on_hand-reserved>0 AND on_hand-reserved<=reorder_point)::int inventory_reorder_alerts,
    coalesce(sum(greatest(on_hand-reserved,0)),0)::numeric available_inventory_units,
    coalesce(sum(reserved),0)::numeric reserved_inventory_units
  FROM trust_merchant_inventory_balances
  GROUP BY merchant_id
),
orders AS (
  SELECT merchant_id,
    count(*)::int seller_order_count,
    count(*) FILTER (WHERE status IN ('PLACED','ACCEPTED','PROCESSING','READY_FOR_HANDOFF'))::int open_order_count,
    count(*) FILTER (WHERE status='SHIPPED')::int shipped_order_count,
    count(*) FILTER (WHERE status='DELIVERED')::int delivered_order_count,
    count(*) FILTER (WHERE status='EXCEPTION')::int exception_order_count,
    coalesce(sum(total),0)::numeric gross_seller_order_value
  FROM trust_seller_orders
  GROUP BY merchant_id
),
fulfillment AS (
  SELECT f.merchant_id,
    count(*)::int fulfillment_count,
    count(*) FILTER (WHERE f.status IN ('PLANNED','PICKING','PACKED','READY_FOR_HANDOFF','HANDED_OFF'))::int fulfillment_open_count,
    count(*) FILTER (WHERE f.status='EXCEPTION')::int fulfillment_exception_count,
    count(*) FILTER (WHERE f.status='DELIVERED')::int fulfillment_delivered_count
  FROM trust_marketplace_fulfillment_orders f
  WHERE f.seller_order_id IS NOT NULL
  GROUP BY f.merchant_id
),
financial AS (
  SELECT so.merchant_id,
    count(*)::int financial_order_count,
    count(*) FILTER (WHERE st.truth_status='OK')::int financial_ok_count,
    count(*) FILTER (WHERE st.truth_status<>'OK')::int financial_exception_count,
    coalesce(sum(st.seller_order_total),0)::numeric seller_order_value,
    coalesce(sum(st.released_amount),0)::numeric released_amount,
    coalesce(sum(st.allocated_refunded_amount),0)::numeric allocated_refunded_amount,
    coalesce(sum(st.payout_allocated + st.legacy_payout_allocated),0)::numeric payout_allocated
  FROM trust_seller_orders so
  JOIN trust_seller_settlement_truth st ON st.seller_order_id=so.id
  GROUP BY so.merchant_id
)
SELECT m.id AS merchant_id,
  coalesce(c.product_count,0) product_count,
  coalesce(c.active_product_count,0) active_product_count,
  coalesce(c.catalog_out_of_stock,0) catalog_out_of_stock,
  coalesce(c.catalog_low_stock,0) catalog_low_stock,
  coalesce(c.catalog_stock_units,0)::numeric catalog_stock_units,
  coalesce(i.inventory_sku_count,0) inventory_sku_count,
  coalesce(i.inventory_out_of_stock,0) inventory_out_of_stock,
  coalesce(i.inventory_reorder_alerts,0) inventory_reorder_alerts,
  coalesce(i.available_inventory_units,0)::numeric available_inventory_units,
  coalesce(i.reserved_inventory_units,0)::numeric reserved_inventory_units,
  coalesce(o.seller_order_count,0) seller_order_count,
  coalesce(o.open_order_count,0) open_order_count,
  coalesce(o.shipped_order_count,0) shipped_order_count,
  coalesce(o.delivered_order_count,0) delivered_order_count,
  coalesce(o.exception_order_count,0) exception_order_count,
  coalesce(o.gross_seller_order_value,0)::numeric gross_seller_order_value,
  coalesce(f.fulfillment_count,0) fulfillment_count,
  coalesce(f.fulfillment_open_count,0) fulfillment_open_count,
  coalesce(f.fulfillment_exception_count,0) fulfillment_exception_count,
  coalesce(f.fulfillment_delivered_count,0) fulfillment_delivered_count,
  coalesce(fin.financial_order_count,0) financial_order_count,
  coalesce(fin.financial_ok_count,0) financial_ok_count,
  coalesce(fin.financial_exception_count,0) financial_exception_count,
  coalesce(fin.seller_order_value,0)::numeric financial_seller_order_value,
  coalesce(fin.released_amount,0)::numeric released_amount,
  coalesce(fin.allocated_refunded_amount,0)::numeric allocated_refunded_amount,
  coalesce(fin.payout_allocated,0)::numeric payout_allocated,
  CASE
    WHEN coalesce(o.exception_order_count,0)>0 OR coalesce(f.fulfillment_exception_count,0)>0 THEN 'OPERATIONS_EXCEPTION'
    WHEN coalesce(fin.financial_exception_count,0)>0 THEN 'FINANCIAL_EXCEPTION'
    WHEN coalesce(i.inventory_out_of_stock,0)>0 OR coalesce(c.catalog_out_of_stock,0)>0 THEN 'INVENTORY_ALERT'
    WHEN coalesce(o.open_order_count,0)>0 THEN 'ORDERS_ACTIVE'
    ELSE 'STABLE'
  END AS operating_status
FROM trust_merchant_profiles m
LEFT JOIN catalog c ON c.merchant_id=m.id
LEFT JOIN merchant_inventory i ON i.merchant_id=m.id
LEFT JOIN orders o ON o.merchant_id=m.id
LEFT JOIN fulfillment f ON f.merchant_id=m.id
LEFT JOIN financial fin ON fin.merchant_id=m.id;
