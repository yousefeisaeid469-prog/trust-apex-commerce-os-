-- TRUST V290 — Productization foundation: real product surfaces, accounting primitives,
-- explainable AI decisions, security events, global commerce, integrations and notifications.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS trust_merchant_store_settings (
  merchant_id uuid PRIMARY KEY REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  country_code char(2) NOT NULL DEFAULT 'EG',
  default_currency char(3) NOT NULL DEFAULT 'EGP',
  default_language text NOT NULL DEFAULT 'en',
  shipping_policy text NOT NULL DEFAULT '',
  return_policy text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE CASCADE,
  sku text NOT NULL UNIQUE,
  title text NOT NULL,
  attributes_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  price numeric(18,2) CHECK(price IS NULL OR price > 0),
  stock integer NOT NULL DEFAULT 0 CHECK(stock >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_product_variants_product ON trust_product_variants(product_id, active);

CREATE TABLE IF NOT EXISTS trust_currency_rates (
  base_currency char(3) NOT NULL,
  quote_currency char(3) NOT NULL,
  rate numeric(28,12) NOT NULL CHECK(rate > 0),
  source text NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(base_currency, quote_currency)
);

CREATE TABLE IF NOT EXISTS trust_accounting_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  account_type text NOT NULL CHECK(account_type IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE')),
  currency char(3) NOT NULL DEFAULT 'EGP',
  owner_type text NOT NULL DEFAULT 'PLATFORM' CHECK(owner_type IN ('PLATFORM','MERCHANT','CUSTOMER')),
  owner_id uuid,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_accounting_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_key text NOT NULL UNIQUE,
  reference_type text NOT NULL,
  reference_id text NOT NULL,
  currency char(3) NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_accounting_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id uuid NOT NULL REFERENCES trust_accounting_journals(id) ON DELETE RESTRICT,
  account_id uuid NOT NULL REFERENCES trust_accounting_accounts(id) ON DELETE RESTRICT,
  direction text NOT NULL CHECK(direction IN ('DEBIT','CREDIT')),
  amount numeric(18,2) NOT NULL CHECK(amount > 0),
  currency char(3) NOT NULL,
  sequence integer NOT NULL CHECK(sequence > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(journal_id, sequence)
);
CREATE INDEX IF NOT EXISTS idx_trust_accounting_entries_account ON trust_accounting_entries(account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_ai_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_key text NOT NULL UNIQUE,
  model text NOT NULL,
  decision_type text NOT NULL,
  input_hash text NOT NULL,
  output_json jsonb NOT NULL,
  explanation text NOT NULL,
  bounded boolean NOT NULL DEFAULT true,
  policy_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  severity text NOT NULL CHECK(severity IN ('INFO','LOW','MEDIUM','HIGH','CRITICAL')),
  request_id text,
  resource_type text,
  resource_id text,
  payload_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_security_events_time ON trust_security_events(created_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_regions (
  country_code char(2) PRIMARY KEY,
  currency char(3) NOT NULL,
  language text NOT NULL,
  tax_mode text NOT NULL DEFAULT 'ABSTRACT',
  active boolean NOT NULL DEFAULT true,
  restrictions_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS trust_tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code char(2) NOT NULL,
  category text,
  rate_bps integer NOT NULL CHECK(rate_bps >= 0 AND rate_bps <= 10000),
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  source text NOT NULL,
  active boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_trust_tax_rules_lookup ON trust_tax_rules(country_code, category, active, effective_from DESC);

CREATE TABLE IF NOT EXISTS trust_integration_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK(kind IN ('PAYMENT','SHIPPING','TAX','ERP','CRM','WAREHOUSE','MARKETPLACE','ACCOUNTING')),
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','PAUSED','REVOKED')),
  config_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(merchant_id, kind, provider)
);

CREATE TABLE IF NOT EXISTS trust_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK(channel IN ('IN_APP','EMAIL','SMS','WEBHOOK')),
  event_type text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED' CHECK(status IN ('QUEUED','SENT','FAILED','READ')),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  read_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_trust_notifications_user ON trust_notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_seller_daily_metrics (
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  metric_date date NOT NULL,
  orders integer NOT NULL DEFAULT 0,
  units integer NOT NULL DEFAULT 0,
  gross numeric(18,2) NOT NULL DEFAULT 0,
  fees numeric(18,2) NOT NULL DEFAULT 0,
  net numeric(18,2) NOT NULL DEFAULT 0,
  refunds numeric(18,2) NOT NULL DEFAULT 0,
  PRIMARY KEY(merchant_id, metric_date)
);

INSERT INTO trust_marketplace_regions(country_code,currency,language) VALUES
('EG','EGP','ar'),('US','USD','en'),('GB','GBP','en'),('AE','AED','ar'),('SA','SAR','ar')
ON CONFLICT(country_code) DO NOTHING;
