-- V279 — customer retention: reviews, wishlists, price alerts, loyalty.
-- Additive and idempotent; verified reviews are derived from durable order history.
ALTER TABLE trust_reviews ADD COLUMN IF NOT EXISTS verified_purchase boolean NOT NULL DEFAULT false;
ALTER TABLE trust_reviews ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE trust_reviews ADD COLUMN IF NOT EXISTS helpful_count integer NOT NULL DEFAULT 0;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='trust_reviews_status_check') THEN
    ALTER TABLE trust_reviews ADD CONSTRAINT trust_reviews_status_check CHECK(status IN ('PUBLISHED','HIDDEN','PENDING'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_trust_reviews_product_quality ON trust_reviews(product_id,status,verified_purchase,helpful_count DESC,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_review_helpful_votes (
  review_id uuid NOT NULL REFERENCES trust_reviews(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(review_id,customer_id)
);

CREATE TABLE IF NOT EXISTS trust_marketplace_wishlists (
  customer_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(customer_id,product_id)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_wishlist_customer ON trust_marketplace_wishlists(customer_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE CASCADE,
  target_price numeric(12,2) NOT NULL CHECK(target_price>0),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','TRIGGERED','CANCELLED')),
  triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id,product_id)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_price_alerts_active ON trust_marketplace_price_alerts(product_id,status,target_price);

CREATE TABLE IF NOT EXISTS trust_marketplace_loyalty_accounts (
  customer_id uuid PRIMARY KEY REFERENCES trust_users(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'STANDARD' CHECK(tier IN ('STANDARD','PLUS','PRO')),
  points bigint NOT NULL DEFAULT 0 CHECK(points>=0),
  lifetime_points bigint NOT NULL DEFAULT 0 CHECK(lifetime_points>=0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_marketplace_loyalty_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE CASCADE,
  points integer NOT NULL CHECK(points>0),
  reason text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_loyalty_customer ON trust_marketplace_loyalty_ledger(customer_id,created_at DESC);
