-- V226 — append-only, hash-chained owner control-room audit.
CREATE TABLE IF NOT EXISTS trust_owner_audit_events (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  result TEXT NOT NULL,
  request_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  previous_hash TEXT,
  event_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_owner_audit_created ON trust_owner_audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_owner_audit_actor ON trust_owner_audit_events(actor_email,created_at DESC);
