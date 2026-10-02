-- V316 — Marketplace OS vertical slice: Tenant → Seller → Catalog → Inventory → Order → Payment → Fulfillment → Finance → Analytics.
CREATE TABLE IF NOT EXISTS trust_v316_marketplace_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES trust_tenants(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE RESTRICT,
  offer_id uuid NOT NULL REFERENCES trust_marketplace_offers(id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL CHECK(status IN ('READY','RUNNING','BLOCKED','COMPLETED','FAILED')),
  fingerprint text NOT NULL,
  workflow_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_v316_marketplace_runs_tenant ON trust_v316_marketplace_runs(tenant_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_v316_marketplace_runs_seller ON trust_v316_marketplace_runs(seller_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_v316_marketplace_runs_status ON trust_v316_marketplace_runs(status,updated_at DESC);

CREATE TABLE IF NOT EXISTS trust_v316_marketplace_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES trust_v316_marketplace_runs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(run_id,event_type)
);
CREATE INDEX IF NOT EXISTS idx_v316_marketplace_events_run ON trust_v316_marketplace_events(run_id,created_at);
