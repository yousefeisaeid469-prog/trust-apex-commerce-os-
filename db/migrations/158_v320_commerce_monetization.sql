-- V320: Real commerce monetization primitives. Additive only.
CREATE TABLE IF NOT EXISTS trust_revenue_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  order_id uuid REFERENCES trust_orders(id) ON DELETE SET NULL,
  merchant_id uuid REFERENCES trust_merchant_profiles(id) ON DELETE SET NULL,
  surface text NOT NULL CHECK(surface IN ('COMMISSION','ADS','SUBSCRIPTION','FULFILLMENT','SELLER_SERVICES','AFFILIATE','B2B','GIFT_CARD','PAYMENT_FEES')),
  kind text NOT NULL CHECK(kind IN ('CHARGE','REFUND','ADJUSTMENT')),
  amount numeric(18,2) NOT NULL CHECK(amount>=0),
  currency char(3) NOT NULL,
  reference_type text NOT NULL,
  reference_id text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_revenue_ledger_surface_created_idx ON trust_revenue_ledger(surface,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_revenue_ledger_order_idx ON trust_revenue_ledger(order_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL CHECK(status IN ('DRAFT','ACTIVE','PAUSED','ENDED')) DEFAULT 'DRAFT',
  campaign_type text NOT NULL CHECK(campaign_type IN ('SPONSORED_PRODUCT','SPONSORED_BRAND','DISPLAY')),
  daily_budget numeric(18,2) NOT NULL CHECK(daily_budget>=0),
  bid numeric(18,2) NOT NULL CHECK(bid>=0),
  currency char(3) NOT NULL DEFAULT 'EGP',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_ad_campaigns_merchant_idx ON trust_ad_campaigns(merchant_id,status);

CREATE TABLE IF NOT EXISTS trust_ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES trust_ad_campaigns(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK(event_type IN ('IMPRESSION','CLICK','CONVERSION')),
  amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(amount>=0),
  currency char(3) NOT NULL,
  order_id uuid REFERENCES trust_orders(id) ON DELETE SET NULL,
  idempotency_key text NOT NULL UNIQUE,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_ad_events_campaign_idx ON trust_ad_events(campaign_id,occurred_at DESC);

CREATE TABLE IF NOT EXISTS trust_subscription_plans (
  code text PRIMARY KEY,
  name text NOT NULL,
  monthly_price numeric(18,2) NOT NULL CHECK(monthly_price>=0),
  currency char(3) NOT NULL DEFAULT 'EGP',
  features_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true
);
INSERT INTO trust_subscription_plans(code,name,monthly_price,currency,features_json) VALUES
('SELLER_BASIC','Seller Basic',0,'EGP','{"listingLimit":100,"analytics":false}'::jsonb),
('SELLER_PRO','Seller Pro',149,'EGP','{"listingLimit":10000,"analytics":true,"ads":true}'::jsonb),
('SELLER_ENTERPRISE','Seller Enterprise',499,'EGP','{"listingLimit":1000000,"analytics":true,"ads":true,"b2b":true}'::jsonb)
ON CONFLICT(code) DO NOTHING;

CREATE TABLE IF NOT EXISTS trust_merchant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  plan_code text NOT NULL REFERENCES trust_subscription_plans(code),
  status text NOT NULL CHECK(status IN ('TRIALING','ACTIVE','PAST_DUE','CANCELLED')) DEFAULT 'ACTIVE',
  provider text NOT NULL DEFAULT 'internal',
  provider_subscription_id text,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_merchant_subscriptions_merchant_idx ON trust_merchant_subscriptions(merchant_id,status);

CREATE UNIQUE INDEX IF NOT EXISTS trust_active_merchant_subscription_idx ON trust_merchant_subscriptions(merchant_id) WHERE status IN ('TRIALING','ACTIVE','PAST_DUE');
