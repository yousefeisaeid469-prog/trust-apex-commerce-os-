-- TRUST V138: distributed-systems control plane. Transactional source of truth remains PostgreSQL.
CREATE TABLE IF NOT EXISTS trust_leases (
  resource_key TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  fence_token BIGINT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_event_log (
  sequence BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_version INTEGER NOT NULL CHECK (event_version > 0),
  correlation_id TEXT NOT NULL,
  causation_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  previous_hash TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_trust_event_log_aggregate ON trust_event_log(tenant_id, aggregate_id, sequence);
CREATE TABLE IF NOT EXISTS trust_command_dedupe (
  command_id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_trust_command_dedupe_identity ON trust_command_dedupe(tenant_id, fingerprint);
CREATE TABLE IF NOT EXISTS trust_saga_runs (
  saga_id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('RUNNING','SUCCEEDED','COMPENSATING','FAILED')),
  current_step TEXT,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_circuit_states (
  circuit_key TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK (state IN ('CLOSED','OPEN','HALF_OPEN')),
  failure_count INTEGER NOT NULL DEFAULT 0,
  opened_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
