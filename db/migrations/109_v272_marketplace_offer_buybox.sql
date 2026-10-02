-- V272 — Marketplace Offer Graph + Buy Box
-- Product truth stays in trust_products. This layer adds a canonical catalog item,
-- seller offers, fulfillment promises, and a deterministic buy-box selection.

CREATE TABLE IF NOT EXISTS trust_marketplace_catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_key text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  brand text NOT NULL DEFAULT '',
  attributes_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','ARCHIVED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_marketplace_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id uuid NOT NULL REFERENCES trust_marketplace_catalog_items(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  price numeric(12,2) NOT NULL CHECK (price > 0),
  shipping_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  handling_days integer NOT NULL DEFAULT 1 CHECK (handling_days >= 0 AND handling_days <= 30),
  delivery_min_days integer NOT NULL DEFAULT 2 CHECK (delivery_min_days >= 0 AND delivery_min_days <= 60),
  delivery_max_days integer NOT NULL DEFAULT 5 CHECK (delivery_max_days >= delivery_min_days AND delivery_max_days <= 90),
  fulfillment_mode text NOT NULL DEFAULT 'MERCHANT_FULFILLED' CHECK (fulfillment_mode IN ('TRUST_FULFILLED','MERCHANT_FULFILLED','PARTNER_FULFILLED')),
  seller_rating numeric(3,2) NOT NULL DEFAULT 0 CHECK (seller_rating BETWEEN 0 AND 5),
  seller_orders integer NOT NULL DEFAULT 0 CHECK (seller_orders >= 0),
  return_rate_bps integer NOT NULL DEFAULT 0 CHECK (return_rate_bps BETWEEN 0 AND 10000),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','SUSPENDED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id),
  UNIQUE(catalog_item_id, merchant_id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_offers_catalog ON trust_marketplace_offers(catalog_item_id, status, price);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_merchant ON trust_marketplace_offers(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_buybox ON trust_marketplace_offers(catalog_item_id, status, stock, price, seller_rating);

CREATE TABLE IF NOT EXISTS trust_marketplace_buybox_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id uuid NOT NULL REFERENCES trust_marketplace_catalog_items(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES trust_marketplace_offers(id) ON DELETE CASCADE,
  score numeric(10,6) NOT NULL,
  reason_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  selected_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_buybox_latest ON trust_marketplace_buybox_snapshots(catalog_item_id, selected_at DESC);

-- Seed one canonical catalog item and offer for every existing real product.
INSERT INTO trust_marketplace_catalog_items(catalog_key,title,category)
SELECT md5(lower(trim(name)) || '|' || lower(trim(category))), name, category
FROM trust_products
WHERE active=true
ON CONFLICT(catalog_key) DO NOTHING;

INSERT INTO trust_marketplace_offers(catalog_item_id,product_id,merchant_id,price,shipping_fee,stock,handling_days,delivery_min_days,delivery_max_days,fulfillment_mode,seller_rating)
SELECT ci.id,p.id,p.merchant_id,p.price,0,p.stock,1,2,5,'MERCHANT_FULFILLED',p.rating
FROM trust_products p
JOIN trust_marketplace_catalog_items ci ON ci.catalog_key=md5(lower(trim(p.name)) || '|' || lower(trim(p.category)))
WHERE p.active=true
ON CONFLICT(product_id) DO UPDATE SET price=excluded.price,stock=excluded.stock,updated_at=now();
