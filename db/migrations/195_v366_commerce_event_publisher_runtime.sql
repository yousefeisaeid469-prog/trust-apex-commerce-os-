-- V366 — Durable commerce event publisher runtime.
-- Makes the outbox publisher observable, bounded, and recoverable in production.

ALTER TABLE trust_outbox_events
  DROP CONSTRAINT IF EXISTS trust_outbox_events_status_check;
ALTER TABLE trust_outbox_events
  ADD CONSTRAINT trust_outbox_events_status_check
  CHECK(status IN ('pending','processing','published','failed','dead'));
ALTER TABLE trust_outbox_events
  ADD COLUMN IF NOT EXISTS dead_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_trust_outbox_publisher_ready_v366
  ON trust_outbox_events(status, available_at, created_at, id);
CREATE INDEX IF NOT EXISTS idx_trust_outbox_publisher_dead_v366
  ON trust_outbox_events(dead_at DESC) WHERE status='dead';

CREATE TABLE IF NOT EXISTS trust_commerce_event_publisher_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id text NOT NULL,
  trigger text NOT NULL CHECK (trigger IN ('vercel-cron','standalone','manual','internal')),
  status text NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING','SUCCEEDED','DEGRADED','FAILED')),
  claimed integer NOT NULL DEFAULT 0 CHECK (claimed >= 0),
  published integer NOT NULL DEFAULT 0 CHECK (published >= 0),
  retried integer NOT NULL DEFAULT 0 CHECK (retried >= 0),
  dead integer NOT NULL DEFAULT 0 CHECK (dead >= 0),
  failed integer NOT NULL DEFAULT 0 CHECK (failed >= 0),
  last_error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_commerce_event_publisher_runs_started_idx
  ON trust_commerce_event_publisher_runs(started_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS trust_commerce_event_publisher_runs_status_idx
  ON trust_commerce_event_publisher_runs(status, started_at DESC);

CREATE TABLE IF NOT EXISTS trust_commerce_event_publisher_heartbeat (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton = true),
  last_started_at timestamptz,
  last_finished_at timestamptz,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  last_worker_id text,
  last_trigger text,
  last_claimed integer NOT NULL DEFAULT 0,
  last_published integer NOT NULL DEFAULT 0,
  last_retried integer NOT NULL DEFAULT 0,
  last_dead integer NOT NULL DEFAULT 0,
  last_failed integer NOT NULL DEFAULT 0,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO trust_commerce_event_publisher_heartbeat(singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

COMMENT ON TABLE trust_commerce_event_publisher_runs IS
  'V366: durable execution records for the commerce outbox publisher.';
COMMENT ON TABLE trust_commerce_event_publisher_heartbeat IS
  'V366: publisher heartbeat for deployment and readiness monitoring.';
