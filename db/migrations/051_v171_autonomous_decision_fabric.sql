CREATE TABLE IF NOT EXISTS trust_decision_policies (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, action TEXT NOT NULL,
  max_risk_bps INTEGER NOT NULL, min_confidence_bps INTEGER NOT NULL,
  max_budget_minor NUMERIC(38,0), autonomy TEXT NOT NULL, enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_decision_proposals (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, policy_id TEXT NOT NULL,
  action TEXT NOT NULL, priority INTEGER NOT NULL, confidence_bps INTEGER NOT NULL,
  risk_bps INTEGER NOT NULL, expected_impact_bps INTEGER NOT NULL,
  requires_approval BOOLEAN NOT NULL, idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
