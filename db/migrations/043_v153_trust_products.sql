-- V153 — trust_products (the missing table)
-- commitCheckout, the payments orchestrator, order lookups, and the
-- persistence boundary all already query trust_products — but no
-- migration ever created it. This migration creates the real,
-- merchant-owned product catalog that the rest of the system already
-- assumes exists, and retires the in-memory demo catalog.

CREATE TABLE IF NOT EXISTS trust_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  price numeric(12,2) NOT NULL CHECK (price > 0),
  old_price numeric(12,2) CHECK (old_price IS NULL OR old_price > price),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active boolean NOT NULL DEFAULT true,
  region text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  image text NOT NULL DEFAULT '',
  rating numeric(3,2) NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trust_products_merchant ON trust_products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_trust_products_active_category ON trust_products(category) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_trust_products_search ON trust_products USING gin (to_tsvector('simple', name || ' ' || category));
