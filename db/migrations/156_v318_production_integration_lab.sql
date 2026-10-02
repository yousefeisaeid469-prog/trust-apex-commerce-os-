-- V318 — durable evidence for production integration drills.
CREATE TABLE IF NOT EXISTS trust_v318_integration_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_id text NOT NULL UNIQUE,
  status text NOT NULL CHECK(status IN ('PASS','FAIL','SKIPPED')),
  live_database boolean NOT NULL DEFAULT false,
  external_providers_live boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL, completed_at timestamptz NOT NULL,
  report_json jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS trust_v318_integration_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_id uuid NOT NULL REFERENCES trust_v318_integration_runs(id) ON DELETE CASCADE,
  check_name text NOT NULL, kind text NOT NULL, status text NOT NULL CHECK(status IN ('PASS','FAIL','SKIPPED')),
  duration_ms integer NOT NULL DEFAULT 0, details_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(run_id,check_name)
);
CREATE INDEX IF NOT EXISTS idx_v318_integration_runs_status ON trust_v318_integration_runs(status,completed_at DESC);
