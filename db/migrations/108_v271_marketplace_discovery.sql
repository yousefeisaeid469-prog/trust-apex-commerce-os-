-- V271: real customer-facing marketplace discovery. Append-only migration history.
CREATE TABLE IF NOT EXISTS trust_marketplace_search_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash text,
  category text,
  region text,
  sort text NOT NULL DEFAULT 'relevance' CHECK(sort IN ('relevance','price_asc','price_desc','rating','newest')),
  result_count integer NOT NULL CHECK(result_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_search_events_created ON trust_marketplace_search_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_search_events_query ON trust_marketplace_search_events(query_hash,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_products_marketplace_price ON trust_products(price) WHERE active=true;
CREATE INDEX IF NOT EXISTS idx_trust_products_marketplace_rating_stock ON trust_products(rating DESC,stock DESC) WHERE active=true;
CREATE INDEX IF NOT EXISTS idx_trust_products_marketplace_region ON trust_products(region) WHERE active=true;
CREATE INDEX IF NOT EXISTS idx_trust_products_marketplace_name_lower ON trust_products(lower(name)) WHERE active=true;
