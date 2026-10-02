-- V337 — Production catalog search runtime
-- Adds a PostgreSQL-native search vector and indexes used by the public catalog API.
-- The existing product truth remains trust_products; this only makes discovery scale beyond ILIKE scans.

ALTER TABLE trust_products
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'simple',
      coalesce(name,'') || ' ' ||
      coalesce(category,'') || ' ' ||
      coalesce(region,'') || ' ' ||
      coalesce(array_to_string(tags,' '),'')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_trust_products_search_vector
  ON trust_products USING GIN (search_vector)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_trust_products_active_price
  ON trust_products(active, price, created_at DESC)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_trust_products_active_rating
  ON trust_products(active, rating DESC, created_at DESC)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_trust_products_active_stock
  ON trust_products(active, stock, created_at DESC)
  WHERE active = true;
