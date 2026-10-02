-- TRUST V139: autonomous distributed control plane primitives.
CREATE TABLE IF NOT EXISTS trust_service_identities (
  identity_id BIGSERIAL PRIMARY KEY, service_id TEXT NOT NULL, tenant_id TEXT NOT NULL,
  key_id TEXT NOT NULL, issued_at TIMESTAMPTZ NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
  nonce TEXT NOT NULL UNIQUE, revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_trust_service_identity_tenant ON trust_service_identities(tenant_id, service_id);
CREATE TABLE IF NOT EXISTS trust_fault_plans (
  plan_id TEXT NOT NULL, version INTEGER NOT NULL CHECK(version > 0), fingerprint TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE, scenarios JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(plan_id, version)
);
CREATE TABLE IF NOT EXISTS trust_trace_spans (
  trace_id TEXT NOT NULL, span_id TEXT NOT NULL, parent_span_id TEXT, name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('UNSET','OK','ERROR')), started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ, attributes JSONB NOT NULL DEFAULT '{}'::jsonb, PRIMARY KEY(trace_id, span_id)
);
CREATE TABLE IF NOT EXISTS trust_cqrs_dispatches (
  command_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, command_name TEXT NOT NULL,
  command_version INTEGER NOT NULL, correlation_id TEXT NOT NULL, status TEXT NOT NULL,
  result JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), completed_at TIMESTAMPTZ
);
