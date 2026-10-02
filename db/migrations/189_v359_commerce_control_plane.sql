-- V359 — Commerce Control Plane.
-- Durable worker-run telemetry and heartbeat state. Operational data only.
CREATE TABLE IF NOT EXISTS trust_commerce_worker_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id text NOT NULL,
  trigger text NOT NULL CHECK (trigger IN ('vercel-cron','standalone','manual','internal')),
  region text,
  status text NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING','SUCCEEDED','FAILED')),
  claimed integer NOT NULL DEFAULT 0 CHECK (claimed >= 0),
  succeeded integer NOT NULL DEFAULT 0 CHECK (succeeded >= 0),
  waiting integer NOT NULL DEFAULT 0 CHECK (waiting >= 0),
  failed integer NOT NULL DEFAULT 0 CHECK (failed >= 0),
  dead integer NOT NULL DEFAULT 0 CHECK (dead >= 0),
  recovered integer NOT NULL DEFAULT 0 CHECK (recovered >= 0),
  error_code text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trust_commerce_worker_runs_started_idx
  ON trust_commerce_worker_runs(started_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS trust_commerce_worker_runs_status_idx
  ON trust_commerce_worker_runs(status, started_at DESC);

CREATE TABLE IF NOT EXISTS trust_commerce_worker_heartbeat (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton = true),
  last_started_at timestamptz,
  last_finished_at timestamptz,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  last_worker_id text,
  last_trigger text,
  last_region text,
  last_claimed integer NOT NULL DEFAULT 0,
  last_succeeded integer NOT NULL DEFAULT 0,
  last_waiting integer NOT NULL DEFAULT 0,
  last_failed integer NOT NULL DEFAULT 0,
  last_dead integer NOT NULL DEFAULT 0,
  last_recovered integer NOT NULL DEFAULT 0,
  last_error_code text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO trust_commerce_worker_heartbeat(singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

COMMENT ON TABLE trust_commerce_worker_runs IS
  'V359: durable operational execution records for commerce workers.';
COMMENT ON TABLE trust_commerce_worker_heartbeat IS
  'V359: singleton heartbeat used by readiness/operations to detect stale worker execution.';
