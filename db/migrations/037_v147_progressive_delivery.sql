-- TRUST V147 Progressive Delivery & Global Rollout Orchestrator
CREATE TABLE IF NOT EXISTS trust_v147_rollouts (
  rollout_id TEXT PRIMARY KEY,
  deployment_id TEXT NOT NULL,
  candidate_hash TEXT NOT NULL,
  phase TEXT NOT NULL,
  decision TEXT NOT NULL,
  completed_percent INTEGER NOT NULL DEFAULT 0,
  runtime_verified BOOLEAN NOT NULL DEFAULT FALSE,
  evidence_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_v147_rollout_stages (
  rollout_id TEXT NOT NULL REFERENCES trust_v147_rollouts(rollout_id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  percent INTEGER NOT NULL,
  regions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL,
  gate_status TEXT NOT NULL,
  gate_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  observed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (rollout_id, ordinal)
);
CREATE TABLE IF NOT EXISTS trust_v147_rollout_transitions (
  rollout_id TEXT NOT NULL REFERENCES trust_v147_rollouts(rollout_id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  phase TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (rollout_id, ordinal)
);
CREATE INDEX IF NOT EXISTS idx_v147_rollouts_candidate ON trust_v147_rollouts(candidate_hash);
CREATE INDEX IF NOT EXISTS idx_v147_rollouts_deployment ON trust_v147_rollouts(deployment_id);
