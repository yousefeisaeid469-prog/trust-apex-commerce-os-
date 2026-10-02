-- V361 durable autonomous orchestration acceptance path.
CREATE TABLE IF NOT EXISTS trust_autonomous_orchestration_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('ACCEPTED','PROCESSED','FAILED')),
  payload JSONB NOT NULL,
  result JSONB,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_autonomous_orchestration_tenant_created
  ON trust_autonomous_orchestration_runs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_autonomous_orchestration_event
  ON trust_autonomous_orchestration_runs(event_id);
