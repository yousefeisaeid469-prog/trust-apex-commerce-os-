CREATE TABLE IF NOT EXISTS trust_v142_reliability_campaigns (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT NOT NULL UNIQUE,
  seed BIGINT NOT NULL,
  scenario TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PASS','FAIL')),
  operation_count INTEGER NOT NULL CHECK (operation_count BETWEEN 1 AND 200),
  fault_count INTEGER NOT NULL CHECK (fault_count >= 0),
  slo_error_rate NUMERIC NOT NULL,
  slo_p95_ms NUMERIC NOT NULL,
  slo_availability NUMERIC NOT NULL,
  receipt_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_v142_failure_corpus (
  id BIGSERIAL PRIMARY KEY,
  failure_hash TEXT NOT NULL UNIQUE,
  campaign_id TEXT NOT NULL,
  minimal_case JSONB NOT NULL,
  replay_fingerprint TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_replayed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS trust_v142_slo_evidence (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  error_rate NUMERIC NOT NULL,
  p95_ms NUMERIC NOT NULL,
  availability NUMERIC NOT NULL,
  error_budget_consumed_pct NUMERIC NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
