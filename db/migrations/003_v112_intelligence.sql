-- TRUST V112 — Intelligence decision ledger foundation
CREATE TABLE IF NOT EXISTS trust_intelligence_decisions (
  id UUID PRIMARY KEY,
  actor_id UUID,
  recommendation_id TEXT NOT NULL,
  action TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('proposed','approved','rejected','executed','verified')),
  confidence NUMERIC(5,4),
  rationale JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trust_intel_decisions_rec ON trust_intelligence_decisions(recommendation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_intel_decisions_state ON trust_intelligence_decisions(decision, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_intelligence_scenarios (
  id UUID PRIMARY KEY,
  scenario_key TEXT NOT NULL,
  assumptions JSONB NOT NULL DEFAULT '{}'::jsonb,
  projection JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trust_intel_scenarios_key ON trust_intelligence_scenarios(scenario_key, created_at DESC);
