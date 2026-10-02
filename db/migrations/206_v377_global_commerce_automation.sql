-- V377 — durable automation plans and learning outcomes.
CREATE TABLE IF NOT EXISTS trust_commerce_automation_plans (
  id BIGSERIAL PRIMARY KEY,
  plan_id UUID NOT NULL UNIQUE,
  fingerprint TEXT NOT NULL,
  version TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('AWAITING_APPROVAL','APPROVED','EXECUTING','VERIFIED','UNVERIFIED','FAILED')),
  payload JSONB NOT NULL,
  created_by TEXT,
  approved_by TEXT,
  approval_reason TEXT,
  executed_by TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_automation_plans_state_created ON trust_commerce_automation_plans(state,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_automation_plans_fingerprint ON trust_commerce_automation_plans(fingerprint,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_commerce_automation_learning (
  id BIGSERIAL PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES trust_commerce_automation_plans(plan_id) ON DELETE CASCADE,
  outcome TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  evidence JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_automation_learning_plan ON trust_commerce_automation_learning(plan_id,created_at DESC);
COMMENT ON TABLE trust_commerce_automation_plans IS 'V377 bounded automation plans; never authoritative for orders, money, inventory, fulfillment or revenue.';
COMMENT ON TABLE trust_commerce_automation_learning IS 'V377 durable outcome evidence for bounded automation; informational and non-authoritative.';
