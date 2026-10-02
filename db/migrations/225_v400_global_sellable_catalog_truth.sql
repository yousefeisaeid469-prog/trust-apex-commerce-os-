-- V400 — Global Sellable Catalog Truth.
-- Read authority joining canonical product, catalog item, offer and variant state.
-- This migration intentionally does not mutate seller stock; it exposes conflicts so
-- checkout/inventory authorities can reject stale or inconsistent sellable states.
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_product_status_stock
  ON trust_marketplace_offers(product_id,status,stock,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_active_stock
  ON trust_product_variants(product_id,active,stock);
CREATE INDEX IF NOT EXISTS idx_catalog_items_status_key
  ON trust_marketplace_catalog_items(status,catalog_key);

CREATE OR REPLACE VIEW trust_sellable_catalog_truth AS
WITH variant_rollup AS (
  SELECT product_id,
         count(*) FILTER (WHERE active=true)::int AS active_variant_count,
         coalesce(sum(stock) FILTER (WHERE active=true),0)::int AS active_variant_stock
  FROM trust_product_variants
  GROUP BY product_id
), offer_rollup AS (
  SELECT product_id,
         count(*) FILTER (WHERE status='ACTIVE')::int AS active_offer_count,
         count(*) FILTER (WHERE status='ACTIVE' AND stock>0)::int AS available_offer_count,
         min(price) FILTER (WHERE status='ACTIVE' AND stock>0) AS lowest_offer_price,
         coalesce(sum(stock) FILTER (WHERE status='ACTIVE'),0)::int AS active_offer_stock
  FROM trust_marketplace_offers
  GROUP BY product_id
)
SELECT
  p.id AS product_id,
  p.merchant_id,
  p.name,
  p.category,
  p.price AS product_price,
  p.stock AS product_stock,
  p.active AS product_active,
  ci.id AS catalog_item_id,
  ci.catalog_key,
  ci.status AS catalog_status,
  coalesce(o.active_offer_count,0) AS active_offer_count,
  coalesce(o.available_offer_count,0) AS available_offer_count,
  o.lowest_offer_price,
  coalesce(o.active_offer_stock,0) AS active_offer_stock,
  coalesce(v.active_variant_count,0) AS active_variant_count,
  coalesce(v.active_variant_stock,0) AS active_variant_stock,
  CASE
    WHEN p.active=false THEN 'PRODUCT_INACTIVE'
    WHEN ci.id IS NULL OR ci.status<>'ACTIVE' THEN 'CATALOG_UNAVAILABLE'
    WHEN coalesce(o.active_offer_count,0)=0 THEN 'NO_ACTIVE_OFFER'
    WHEN coalesce(o.available_offer_count,0)=0 THEN 'OUT_OF_STOCK'
    WHEN p.stock <> coalesce(o.active_offer_stock,0) THEN 'STOCK_TRUTH_CONFLICT'
    ELSE 'SELLABLE'
  END AS sellable_status
FROM trust_products p
LEFT JOIN LATERAL (
  SELECT c.id,c.catalog_key,c.status
  FROM trust_marketplace_catalog_items c
  JOIN trust_marketplace_offers oo ON oo.catalog_item_id=c.id AND oo.product_id=p.id
  ORDER BY c.updated_at DESC,c.id ASC
  LIMIT 1
) ci ON true
LEFT JOIN offer_rollup o ON o.product_id=p.id
LEFT JOIN variant_rollup v ON v.product_id=p.id;

CREATE INDEX IF NOT EXISTS idx_trust_products_active_stock ON trust_products(active,stock,updated_at DESC);
