CREATE TABLE IF NOT EXISTS trust_v315_verification_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('sandbox','live')),
  status TEXT NOT NULL CHECK (status IN ('PASS','FAIL','SKIPPED')),
  total_cases INTEGER NOT NULL DEFAULT 0,
  passed_cases INTEGER NOT NULL DEFAULT 0,
  failed_cases INTEGER NOT NULL DEFAULT 0,
  skipped_cases INTEGER NOT NULL DEFAULT 0,
  evidence_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_v315_verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES trust_v315_verification_runs(id) ON DELETE CASCADE,
  case_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  workflow TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PASS','FAIL','SKIPPED')),
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  error TEXT,
  UNIQUE(run_id, case_id)
);
CREATE TABLE IF NOT EXISTS trust_v315_failure_injections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES trust_v315_verification_runs(id) ON DELETE SET NULL,
  point TEXT NOT NULL,
  mode TEXT NOT NULL,
  rate NUMERIC,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_v315_replay_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow TEXT NOT NULL,
  event_count INTEGER NOT NULL,
  deterministic BOOLEAN NOT NULL,
  state_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_v315_verification_results_run ON trust_v315_verification_results(run_id);
CREATE INDEX IF NOT EXISTS idx_v315_failure_injections_active ON trust_v315_failure_injections(enabled, point);
