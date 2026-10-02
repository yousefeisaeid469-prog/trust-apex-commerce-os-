-- TRUST V135 — enterprise control plane: tenancy, entitlements, usage, billing and operational telemetry.
CREATE TABLE IF NOT EXISTS trust_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  legal_name text NOT NULL,
  plan text NOT NULL CHECK(plan IN ('starter','growth','scale','enterprise')),
  state text NOT NULL CHECK(state IN ('active','suspended','closed')) DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_entitlements (
  tenant_id uuid NOT NULL REFERENCES trust_tenants(id) ON DELETE CASCADE,
  capability text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  source text NOT NULL CHECK(source IN ('plan','override','contract')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,capability)
);
CREATE TABLE IF NOT EXISTS trust_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES trust_tenants(id) ON DELETE CASCADE,
  metric text NOT NULL CHECK(metric IN ('orders','api_requests','ai_tokens','storage_bytes','events')),
  quantity numeric NOT NULL CHECK(quantity > 0),
  idempotency_key text NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,metric,idempotency_key)
);
CREATE INDEX IF NOT EXISTS trust_usage_tenant_time_idx ON trust_usage_events(tenant_id,metric,occurred_at DESC);
CREATE TABLE IF NOT EXISTS trust_billing_accounts (
  tenant_id uuid PRIMARY KEY REFERENCES trust_tenants(id) ON DELETE CASCADE,
  state text NOT NULL CHECK(state IN ('trialing','active','past_due','paused','cancelled')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_operational_metrics (
  id bigserial PRIMARY KEY,
  tenant_id uuid REFERENCES trust_tenants(id) ON DELETE SET NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  dimensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  observed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_operational_metrics_name_time_idx ON trust_operational_metrics(metric_name,observed_at DESC);
