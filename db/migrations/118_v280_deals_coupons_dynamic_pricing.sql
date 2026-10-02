-- V280 — Deals, Coupons, Vouchers and bounded dynamic pricing.
-- All customer-visible prices remain server-authoritative and checkout-bound.

CREATE TABLE IF NOT EXISTS trust_marketplace_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES trust_marketplace_offers(id) ON DELETE CASCADE,
  deal_type text NOT NULL CHECK (deal_type IN ('PERCENT','FIXED')),
  discount_bps integer CHECK (discount_bps IS NULL OR (discount_bps > 0 AND discount_bps <= 9000)),
  discount_amount numeric(12,2) CHECK (discount_amount IS NULL OR discount_amount > 0),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  quantity_limit integer CHECK (quantity_limit IS NULL OR quantity_limit > 0),
  claimed_quantity integer NOT NULL DEFAULT 0 CHECK (claimed_quantity >= 0),
  status text NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('DRAFT','SCHEDULED','ACTIVE','PAUSED','EXPIRED')),
  badge text NOT NULL DEFAULT 'DEAL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CHECK ((deal_type='PERCENT' AND discount_bps IS NOT NULL AND discount_amount IS NULL) OR (deal_type='FIXED' AND discount_amount IS NOT NULL AND discount_bps IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_marketplace_deals_offer_window ON trust_marketplace_deals(offer_id,status,starts_at,ends_at);

CREATE TABLE IF NOT EXISTS trust_marketplace_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  merchant_id uuid REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES trust_products(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES trust_marketplace_offers(id) ON DELETE CASCADE,
  discount_type text NOT NULL CHECK (discount_type IN ('PERCENT','FIXED')),
  discount_bps integer CHECK (discount_bps IS NULL OR (discount_bps > 0 AND discount_bps <= 9000)),
  discount_amount numeric(12,2) CHECK (discount_amount IS NULL OR discount_amount > 0),
  min_subtotal numeric(12,2) NOT NULL DEFAULT 0 CHECK (min_subtotal >= 0),
  max_discount numeric(12,2) CHECK (max_discount IS NULL OR max_discount > 0),
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  per_customer_limit integer NOT NULL DEFAULT 1 CHECK (per_customer_limit > 0),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('DRAFT','SCHEDULED','ACTIVE','PAUSED','EXPIRED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CHECK ((discount_type='PERCENT' AND discount_bps IS NOT NULL AND discount_amount IS NULL) OR (discount_type='FIXED' AND discount_amount IS NOT NULL AND discount_bps IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_marketplace_coupons_active ON trust_marketplace_coupons(code,status,starts_at,ends_at);

CREATE TABLE IF NOT EXISTS trust_marketplace_coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES trust_marketplace_coupons(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES trust_orders(id) ON DELETE SET NULL,
  discount_amount numeric(12,2) NOT NULL CHECK (discount_amount >= 0),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_coupon_customer ON trust_marketplace_coupon_redemptions(coupon_id,customer_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  customer_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  original_amount numeric(12,2) NOT NULL CHECK (original_amount > 0),
  remaining_amount numeric(12,2) NOT NULL CHECK (remaining_amount >= 0),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXHAUSTED','CANCELLED','EXPIRED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (remaining_amount <= original_amount)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_vouchers_customer ON trust_marketplace_vouchers(customer_id,status,expires_at);

CREATE TABLE IF NOT EXISTS trust_marketplace_voucher_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id uuid NOT NULL REFERENCES trust_marketplace_vouchers(id) ON DELETE CASCADE,
  order_id uuid REFERENCES trust_orders(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_voucher_redemptions_voucher ON trust_marketplace_voucher_redemptions(voucher_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES trust_marketplace_offers(id) ON DELETE CASCADE,
  previous_price numeric(12,2) NOT NULL CHECK (previous_price > 0),
  new_price numeric(12,2) NOT NULL CHECK (new_price > 0),
  reason text NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_price_history_offer ON trust_marketplace_price_history(offer_id,observed_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_dynamic_price_rules (
  offer_id uuid PRIMARY KEY REFERENCES trust_marketplace_offers(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  min_price numeric(12,2) NOT NULL CHECK (min_price > 0),
  max_price numeric(12,2) NOT NULL CHECK (max_price >= min_price),
  max_adjustment_bps integer NOT NULL DEFAULT 1000 CHECK (max_adjustment_bps BETWEEN 0 AND 3000),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_deal_claims ON trust_marketplace_deals(id,status,quantity_limit,claimed_quantity);
