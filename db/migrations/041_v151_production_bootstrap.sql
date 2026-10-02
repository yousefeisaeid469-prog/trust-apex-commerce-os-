CREATE TABLE IF NOT EXISTS trust_v151_bootstrap_runs (
  run_id uuid PRIMARY KEY,
  version text NOT NULL,
  ready boolean NOT NULL,
  probes jsonb NOT NULL,
  evidence_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_v151_bootstrap_runs_created_at_idx ON trust_v151_bootstrap_runs(created_at DESC);
