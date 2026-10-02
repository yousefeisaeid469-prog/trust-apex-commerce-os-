-- TRUST V140: reliability evidence and replayable incident records.
CREATE TABLE IF NOT EXISTS trust_reliability_campaigns (
  campaign_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  seed BIGINT NOT NULL,
  iterations INTEGER NOT NULL CHECK (iterations > 0 AND iterations <= 100000),
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_incident_events (
  incident_id TEXT NOT NULL,
  sequence BIGINT NOT NULL CHECK (sequence > 0),
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  PRIMARY KEY (incident_id, sequence)
);
CREATE INDEX IF NOT EXISTS idx_trust_incident_events_time ON trust_incident_events (occurred_at);
