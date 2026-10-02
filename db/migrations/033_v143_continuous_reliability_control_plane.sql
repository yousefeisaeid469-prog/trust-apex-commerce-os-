CREATE TABLE IF NOT EXISTS trust_v143_reliability_policies (
  policy_id TEXT PRIMARY KEY,
  min_availability NUMERIC NOT NULL CHECK (min_availability BETWEEN 0 AND 1),
  max_error_rate NUMERIC NOT NULL CHECK (max_error_rate BETWEEN 0 AND 1),
  max_p95_ms NUMERIC NOT NULL CHECK (max_p95_ms > 0),
  max_budget_consumed_pct NUMERIC NOT NULL CHECK (max_budget_consumed_pct BETWEEN 0 AND 100),
  require_replay_match BOOLEAN NOT NULL,
  block_on_new_failure BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_v143_release_verdicts (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PASS','BLOCK')),
  reasons JSONB NOT NULL,
  measured JSONB NOT NULL,
  failure_hash TEXT,
  replay_matches BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_v143_failure_corpus_index (
  failure_hash TEXT PRIMARY KEY,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  occurrence_count INTEGER NOT NULL DEFAULT 1 CHECK (occurrence_count > 0),
  latest_verdict TEXT NOT NULL CHECK (latest_verdict IN ('PASS','BLOCK'))
);
