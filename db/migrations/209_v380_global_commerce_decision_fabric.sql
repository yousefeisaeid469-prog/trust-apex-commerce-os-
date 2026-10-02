-- V380 — durable, deterministic cross-domain decision fabric.
CREATE TABLE IF NOT EXISTS trust_commerce_decision_requests (
  id BIGSERIAL PRIMARY KEY,
  decision_id UUID NOT NULL UNIQUE,
  domain TEXT NOT NULL CHECK (domain IN ('ORDER','PAYMENT','INVENTORY','FULFILLMENT','DELIVERY','RETURNS','DISPUTES','PAYOUTS','REVENUE','RECOVERY','GENERAL')),
  decision_type TEXT NOT NULL,
  subject_id TEXT,
  requested_by TEXT,
  input JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('EVALUATED','REQUIRES_APPROVAL','DENIED','NO_DECISION')),
  outcome TEXT NOT NULL CHECK (outcome IN ('ALLOW','REQUIRE_APPROVAL','DENY','NO_DECISION')),
  evidence JSONB NOT NULL,
  policy JSONB,
  authority TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_commerce_decision_evaluations (
  id BIGSERIAL PRIMARY KEY,
  evaluation_id UUID NOT NULL UNIQUE,
  decision_id UUID NOT NULL REFERENCES trust_commerce_decision_requests(decision_id),
  rule_id TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('MATCH','NO_MATCH','BLOCKED')),
  rationale TEXT NOT NULL,
  evidence JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_decision_requests_domain_time ON trust_commerce_decision_requests(domain,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_requests_subject ON trust_commerce_decision_requests(subject_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_evaluations_decision ON trust_commerce_decision_evaluations(decision_id,created_at DESC);
COMMENT ON TABLE trust_commerce_decision_requests IS 'V380 deterministic decision records; this layer coordinates evidence and policy but does not own business mutation authority.';
COMMENT ON TABLE trust_commerce_decision_evaluations IS 'Durable rule-level evidence supporting V380 decisions.';
COMMENT ON COLUMN trust_commerce_decision_requests.authority IS 'Decision-fabric authority reference; directBusinessMutation=false by design.';
