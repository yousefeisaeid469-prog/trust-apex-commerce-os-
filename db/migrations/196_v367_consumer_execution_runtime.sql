-- V367 — durable consumer execution runtime.
-- Adds worker-run, heartbeat and lease-observability state for delivery handlers.

CREATE TABLE IF NOT EXISTS trust_commerce_consumer_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  trigger TEXT NOT NULL CHECK (trigger IN ('standalone','vercel-cron','manual','internal')),
  status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING','SUCCEEDED','DEGRADED','FAILED')),
  claimed INTEGER NOT NULL DEFAULT 0 CHECK (claimed >= 0),
  processed INTEGER NOT NULL DEFAULT 0 CHECK (processed >= 0),
  retried INTEGER NOT NULL DEFAULT 0 CHECK (retried >= 0),
  dead_lettered INTEGER NOT NULL DEFAULT 0 CHECK (dead_lettered >= 0),
  failed INTEGER NOT NULL DEFAULT 0 CHECK (failed >= 0),
  last_error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trust_commerce_consumer_runs_lookup
  ON trust_commerce_consumer_runs(consumer_id, started_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_consumer_runs_status
  ON trust_commerce_consumer_runs(status, started_at DESC);

CREATE TABLE IF NOT EXISTS trust_commerce_consumer_heartbeat (
  consumer_id TEXT PRIMARY KEY,
  last_started_at TIMESTAMPTZ,
  last_finished_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_worker_id TEXT,
  last_trigger TEXT,
  last_claimed INTEGER NOT NULL DEFAULT 0,
  last_processed INTEGER NOT NULL DEFAULT 0,
  last_retried INTEGER NOT NULL DEFAULT 0,
  last_dead_lettered INTEGER NOT NULL DEFAULT 0,
  last_failed INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trust_event_deliveries_consumer_ready_v367
  ON trust_event_deliveries(consumer_id, status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_trust_event_deliveries_processing_v367
  ON trust_event_deliveries(consumer_id, locked_at) WHERE status='PROCESSING';
