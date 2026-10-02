-- V379 — versioned governance for learned automation policies.
CREATE TABLE IF NOT EXISTS trust_commerce_policy_revisions (
  id BIGSERIAL PRIMARY KEY,
  revision_id UUID NOT NULL UNIQUE,
  policy_key TEXT NOT NULL,
  revision TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('RECOVER_ORDER_LEASES')),
  state TEXT NOT NULL CHECK (state IN ('PROPOSED','CANARY','ACTIVE','ROLLED_BACK')),
  source_policy_id UUID,
  created_by TEXT NOT NULL,
  creation_reason TEXT NOT NULL,
  activated_by TEXT,
  activation_reason TEXT,
  activated_at TIMESTAMPTZ,
  rolled_back_by TEXT,
  rollback_reason TEXT,
  rolled_back_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(policy_key, revision)
);
CREATE TABLE IF NOT EXISTS trust_commerce_policy_canary_evaluations (
  id BIGSERIAL PRIMARY KEY,
  evaluation_id UUID NOT NULL UNIQUE,
  revision_id UUID NOT NULL REFERENCES trust_commerce_policy_revisions(revision_id),
  fingerprint TEXT NOT NULL,
  samples INT NOT NULL,
  verified_samples INT NOT NULL,
  failures INT NOT NULL,
  failure_rate NUMERIC(8,6) NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('PASS','FAIL','INCONCLUSIVE')),
  evidence JSONB NOT NULL,
  evaluated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_policy_revisions_key_state ON trust_commerce_policy_revisions(policy_key,state,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_canary_revision ON trust_commerce_policy_canary_evaluations(revision_id,created_at DESC);
COMMENT ON TABLE trust_commerce_policy_revisions IS 'V379 governance lifecycle for learned policies; not authoritative for business money, inventory, fulfillment or revenue.';
COMMENT ON TABLE trust_commerce_policy_canary_evaluations IS 'Replay-only canary evidence over recorded automation outcomes; never mutates live commerce state.';
