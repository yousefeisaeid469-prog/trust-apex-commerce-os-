CREATE TABLE IF NOT EXISTS trust_v141_verification_campaigns (
  id TEXT PRIMARY KEY, seed BIGINT NOT NULL, iterations INTEGER NOT NULL CHECK (iterations > 0 AND iterations <= 100000),
  fingerprint TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('PASS','FAIL')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_v141_recovery_evidence (
  id TEXT PRIMARY KEY, incident_id TEXT NOT NULL, step_name TEXT NOT NULL, verified BOOLEAN NOT NULL, observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (incident_id, step_name)
);
CREATE TABLE IF NOT EXISTS trust_v141_chaos_events (
  id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL REFERENCES trust_v141_verification_campaigns(id), tenant_id TEXT NOT NULL, event_type TEXT NOT NULL, sequence BIGINT NOT NULL, fingerprint TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (campaign_id, sequence)
);
