-- V88 operational hardening: durable idempotency, outbox retries and observability.
CREATE TABLE IF NOT EXISTS trust_outbox_attempts (
  id BIGSERIAL PRIMARY KEY, event_id UUID NOT NULL, attempt_no INTEGER NOT NULL, attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), status TEXT NOT NULL, error_code TEXT,
  UNIQUE(event_id, attempt_no)
);
CREATE INDEX IF NOT EXISTS idx_outbox_attempts_event ON trust_outbox_attempts(event_id, attempted_at DESC);

CREATE TABLE IF NOT EXISTS trust_api_idempotency (
  scope TEXT NOT NULL, idempotency_key TEXT NOT NULL, request_hash TEXT NOT NULL, status_code INTEGER, response_json JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY(scope, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_api_idempotency_expiry ON trust_api_idempotency(expires_at);

CREATE TABLE IF NOT EXISTS trust_audit_events (
  id BIGSERIAL PRIMARY KEY, actor_id UUID, action TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT, request_id TEXT, payload_hash TEXT NOT NULL, previous_hash TEXT, chain_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_request ON trust_audit_events(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON trust_audit_events(resource_type, resource_id, created_at DESC);
