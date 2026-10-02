CREATE TABLE IF NOT EXISTS trust_v148_global_deployment_runs (
  id BIGSERIAL PRIMARY KEY,
  deployment_id TEXT NOT NULL,
  rollout_id TEXT NOT NULL,
  candidate_hash TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('PROMOTE','HALT','ROLLBACK','ESCALATE')),
  phase TEXT NOT NULL,
  global_traffic_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  runtime_verified BOOLEAN NOT NULL,
  evidence_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_v148_region_rollouts (
  id BIGSERIAL PRIMARY KEY,
  deployment_run_id BIGINT NOT NULL REFERENCES trust_v148_global_deployment_runs(id) ON DELETE CASCADE,
  region TEXT NOT NULL,
  weight_pct NUMERIC(6,2) NOT NULL,
  capacity_pct NUMERIC(6,2) NOT NULL,
  promoted BOOLEAN NOT NULL DEFAULT FALSE,
  healthy BOOLEAN NOT NULL,
  rollback_verified BOOLEAN NOT NULL DEFAULT FALSE,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (deployment_run_id, region)
);
CREATE TABLE IF NOT EXISTS trust_v148_global_traffic_controls (
  control_key TEXT PRIMARY KEY,
  global_traffic_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  frozen BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
