CREATE TABLE IF NOT EXISTS trust_v145_release_candidates (
  candidate_hash TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  source_fingerprint TEXT NOT NULL,
  migration_fingerprint TEXT NOT NULL,
  policy_revision TEXT NOT NULL,
  build_ref TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS trust_v145_production_reliability_cycles (
  cycle_id UUID PRIMARY KEY,
  candidate_hash TEXT NOT NULL REFERENCES trust_v145_release_candidates(candidate_hash),
  incident_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  rollout_id TEXT NOT NULL,
  signal JSONB NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('RESUME','ROLLBACK','ESCALATE','MITIGATE_AND_VERIFY')),
  status TEXT NOT NULL CHECK (status IN ('RECOVERED','ROLLED_BACK','ESCALATED','BLOCKED')),
  runtime_verified BOOLEAN NOT NULL,
  bundle_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_v145_runtime_reconciliation (
  id BIGSERIAL PRIMARY KEY,
  incident_id TEXT NOT NULL,
  expected_state TEXT NOT NULL,
  observed_state JSONB NOT NULL,
  verified BOOLEAN NOT NULL,
  evidence_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
