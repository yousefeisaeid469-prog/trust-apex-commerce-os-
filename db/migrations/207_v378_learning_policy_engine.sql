-- V378 — durable learning-derived automation policies.
CREATE TABLE IF NOT EXISTS trust_commerce_automation_policies (
  id BIGSERIAL PRIMARY KEY,
  policy_id UUID NOT NULL UNIQUE,
  policy_key TEXT NOT NULL UNIQUE,
  fingerprint TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('RECOVER_ORDER_LEASES')),
  state TEXT NOT NULL CHECK (state IN ('PROPOSED','ACTIVE','PAUSED')),
  revision TEXT NOT NULL,
  evidence JSONB NOT NULL,
  payload JSONB NOT NULL,
  approved_by TEXT,
  approval_reason TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_automation_policies_fingerprint ON trust_commerce_automation_policies(fingerprint,state,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_automation_policies_state ON trust_commerce_automation_policies(state,updated_at DESC);
COMMENT ON TABLE trust_commerce_automation_policies IS 'V378 learned policy evidence and owner-promoted policy state; never authoritative for business money, inventory, fulfillment or revenue.';
