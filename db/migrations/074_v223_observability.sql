-- V223 — durable production observability and incident telemetry.
CREATE TABLE IF NOT EXISTS trust_observability_events (
  event_id text PRIMARY KEY,
  kind text NOT NULL,
  name text NOT NULL,
  occurred_at timestamptz NOT NULL,
  duration_ms integer,
  success boolean,
  region text,
  route text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_observability_events_time ON trust_observability_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_observability_events_kind_time ON trust_observability_events(kind,occurred_at DESC);
CREATE TABLE IF NOT EXISTS trust_incidents (
  incident_id text PRIMARY KEY,
  severity text NOT NULL CHECK(severity IN ('SEV1','SEV2','SEV3','SEV4')),
  status text NOT NULL CHECK(status IN ('OPEN','MITIGATING','RESOLVED')),
  title text NOT NULL,
  region text,
  started_at timestamptz NOT NULL,
  resolved_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_incidents_status_severity ON trust_incidents(status,severity,started_at DESC);
