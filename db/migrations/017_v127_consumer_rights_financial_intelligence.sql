CREATE TABLE IF NOT EXISTS trust_rights_checks (
  id BIGSERIAL PRIMARY KEY,
  customer_id TEXT,
  order_id TEXT,
  check_type TEXT NOT NULL,
  status TEXT NOT NULL,
  confidence NUMERIC(5,4) NOT NULL,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_financial_decisions (
  id BIGSERIAL PRIMARY KEY,
  customer_id TEXT,
  product_id TEXT,
  currency TEXT NOT NULL,
  upfront_cost NUMERIC(18,2) NOT NULL,
  lifecycle_cost NUMERIC(18,2) NOT NULL,
  assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trust_rights_checks_customer ON trust_rights_checks(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_financial_decisions_customer ON trust_financial_decisions(customer_id, created_at DESC);
