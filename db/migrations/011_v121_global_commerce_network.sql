-- TRUST V121: Global Commerce Network
CREATE TABLE IF NOT EXISTS trust_network_sellers (
  seller_id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING','VERIFIED','SUSPENDED')),
  trust_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_network_inventory_offers (
  offer_id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES trust_network_sellers(seller_id),
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  price_minor BIGINT NOT NULL CHECK (price_minor >= 0),
  currency CHAR(3) NOT NULL,
  region_code TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_network_inventory_product ON trust_network_inventory_offers(product_id, region_code);
CREATE TABLE IF NOT EXISTS trust_network_cart_lines (
  cart_id TEXT NOT NULL,
  line_id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES trust_network_sellers(seller_id),
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_minor BIGINT NOT NULL CHECK (unit_price_minor >= 0),
  currency CHAR(3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_network_cart ON trust_network_cart_lines(cart_id);
CREATE TABLE IF NOT EXISTS trust_network_reputation_edges (
  edge_id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES trust_network_sellers(seller_id),
  dimension TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  sample_size INTEGER NOT NULL DEFAULT 0 CHECK (sample_size >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
