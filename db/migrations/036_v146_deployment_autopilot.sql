-- TRUST V146 Deployment Autopilot
CREATE TABLE IF NOT EXISTS trust_v146_deployments (
  deployment_id TEXT PRIMARY KEY,
  rollout_id TEXT NOT NULL,
  candidate_hash TEXT NOT NULL,
  version TEXT NOT NULL,
  phase TEXT NOT NULL,
  decision TEXT NOT NULL,
  runtime_verified BOOLEAN NOT NULL DEFAULT FALSE,
  evidence_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_v146_deployment_gates (
  deployment_id TEXT NOT NULL REFERENCES trust_v146_deployments(deployment_id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  status TEXT NOT NULL,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  observed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (deployment_id, ordinal)
);
CREATE TABLE IF NOT EXISTS trust_v146_deployment_transitions (
  deployment_id TEXT NOT NULL REFERENCES trust_v146_deployments(deployment_id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  phase TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (deployment_id, ordinal)
);
CREATE INDEX IF NOT EXISTS idx_v146_deployments_candidate ON trust_v146_deployments(candidate_hash);
CREATE INDEX IF NOT EXISTS idx_v146_deployments_rollout ON trust_v146_deployments(rollout_id);
