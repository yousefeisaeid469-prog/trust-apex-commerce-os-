-- V270: real marketplace growth + monetization runtime. Immutable migration history: append only.
CREATE TABLE IF NOT EXISTS trust_marketplace_seller_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  plan_code text NOT NULL,
  monthly_fee numeric(18,2) NOT NULL DEFAULT 0 CHECK(monthly_fee>=0),
  per_order_fee numeric(18,2) NOT NULL DEFAULT 0 CHECK(per_order_fee>=0),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','PAUSED','CANCELLED')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(merchant_id)
);

CREATE TABLE IF NOT EXISTS trust_marketplace_fee_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  order_id uuid,
  fee_type text NOT NULL,
  program_code text NOT NULL,
  base_amount numeric(18,2) NOT NULL CHECK(base_amount>=0),
  rate_bps integer NOT NULL DEFAULT 0 CHECK(rate_bps>=0),
  fee_amount numeric(18,2) NOT NULL CHECK(fee_amount>=0),
  currency text NOT NULL DEFAULT 'EGP',
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(merchant_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_fee_ledger_order ON trust_marketplace_fee_ledger(order_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  campaign_type text NOT NULL CHECK(campaign_type IN ('SPONSORED_PRODUCT','SPONSORED_BRAND','SPONSORED_DISPLAY')),
  name text NOT NULL,
  daily_budget numeric(18,2) NOT NULL CHECK(daily_budget>=0),
  bid_amount numeric(18,2) NOT NULL CHECK(bid_amount>=0),
  status text NOT NULL DEFAULT 'PAUSED' CHECK(status IN ('DRAFT','ACTIVE','PAUSED','ENDED')),
  targeting_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_ad_campaigns_merchant ON trust_marketplace_ad_campaigns(merchant_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_ad_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES trust_marketplace_ad_campaigns(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK(event_type IN ('IMPRESSION','CLICK')),
  amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(amount>=0),
  order_id uuid,
  idempotency_key text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_ad_ledger_campaign ON trust_marketplace_ad_ledger(campaign_id,occurred_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_customer_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  plan_code text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','PAUSED','CANCELLED','EXPIRED')),
  monthly_fee numeric(18,2) NOT NULL DEFAULT 0 CHECK(monthly_fee>=0),
  benefits_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  renews_at timestamptz,
  cancelled_at timestamptz,
  UNIQUE(customer_id,plan_code)
);
CREATE INDEX IF NOT EXISTS idx_customer_memberships_active ON trust_marketplace_customer_memberships(customer_id,status);

CREATE TABLE IF NOT EXISTS trust_marketplace_product_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE CASCADE,
  quantity numeric(18,4) NOT NULL CHECK(quantity>0),
  interval_days integer NOT NULL CHECK(interval_days>=1),
  discount_bps integer NOT NULL DEFAULT 0 CHECK(discount_bps BETWEEN 0 AND 5000),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','PAUSED','CANCELLED')),
  next_order_at timestamptz NOT NULL,
  last_order_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id,product_id)
);
CREATE INDEX IF NOT EXISTS idx_product_subscriptions_due ON trust_marketplace_product_subscriptions(status,next_order_at);

CREATE TABLE IF NOT EXISTS trust_marketplace_fulfillment_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  program_code text NOT NULL CHECK(program_code IN ('PLATFORM_FULFILLMENT','MULTICHANNEL_FULFILLMENT','SELLER_FULFILLED')),
  warehouse_code text NOT NULL DEFAULT 'DEFAULT',
  storage_rate numeric(18,4) NOT NULL DEFAULT 0 CHECK(storage_rate>=0),
  pick_pack_rate numeric(18,4) NOT NULL DEFAULT 0 CHECK(pick_pack_rate>=0),
  shipping_rate numeric(18,4) NOT NULL DEFAULT 0 CHECK(shipping_rate>=0),
  return_rate numeric(18,4) NOT NULL DEFAULT 0 CHECK(return_rate>=0),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','PAUSED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(merchant_id,program_code,warehouse_code)
);

CREATE TABLE IF NOT EXISTS trust_marketplace_b2b_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  company_name text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','SUSPENDED')),
  payment_terms_days integer NOT NULL DEFAULT 0 CHECK(payment_terms_days>=0),
  tax_exempt boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id,company_name)
);

CREATE TABLE IF NOT EXISTS trust_marketplace_quantity_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE CASCADE,
  min_quantity numeric(18,4) NOT NULL CHECK(min_quantity>0),
  unit_price numeric(18,2) NOT NULL CHECK(unit_price>=0),
  currency text NOT NULL DEFAULT 'EGP',
  UNIQUE(product_id,min_quantity)
);
CREATE INDEX IF NOT EXISTS idx_quantity_prices_product ON trust_marketplace_quantity_prices(product_id,min_quantity DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_affiliate_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code text NOT NULL,
  order_id uuid,
  merchant_id uuid,
  attributed_amount numeric(18,2) NOT NULL CHECK(attributed_amount>=0),
  commission_bps integer NOT NULL DEFAULT 0 CHECK(commission_bps BETWEEN 0 AND 10000),
  commission_amount numeric(18,2) NOT NULL CHECK(commission_amount>=0),
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','PAID','REVERSED')),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_affiliate_ledger_code ON trust_marketplace_affiliate_ledger(affiliate_code,created_at DESC);
