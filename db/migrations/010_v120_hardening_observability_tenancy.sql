-- V120: security posture, operational telemetry, tenant onboarding and recovery contracts
CREATE TABLE IF NOT EXISTS trust_tenant_onboarding (
  merchant_id TEXT PRIMARY KEY,
  stage TEXT NOT NULL,
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS trust_telemetry_events (
  id BIGSERIAL PRIMARY KEY,
  service TEXT NOT NULL,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  duration_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_telemetry_created ON trust_telemetry_events(created_at DESC);
CREATE TABLE IF NOT EXISTS trust_incident_deliveries (
  id BIGSERIAL PRIMARY KEY,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_status INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
