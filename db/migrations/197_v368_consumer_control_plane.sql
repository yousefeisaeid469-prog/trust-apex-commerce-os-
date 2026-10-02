-- V368 — Consumer Control Plane: live lag/health snapshots and durable stale-delivery recovery.
CREATE TABLE IF NOT EXISTS trust_commerce_consumer_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('HEALTHY','DEGRADED','UNAVAILABLE')),
  pending_count INTEGER NOT NULL DEFAULT 0,
  processing_count INTEGER NOT NULL DEFAULT 0,
  retrying_count INTEGER NOT NULL DEFAULT 0,
  dead_letter_count INTEGER NOT NULL DEFAULT 0,
  oldest_pending_at TIMESTAMPTZ,
  oldest_processing_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  heartbeat_stale BOOLEAN NOT NULL DEFAULT false,
  retry_rate_5m INTEGER NOT NULL DEFAULT 0,
  dead_letter_rate_5m INTEGER NOT NULL DEFAULT 0,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_consumer_health_snapshots_lookup
  ON trust_commerce_consumer_health_snapshots(consumer_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS trust_commerce_consumer_recovery_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key TEXT NOT NULL UNIQUE,
  consumer_id TEXT NOT NULL,
  tenant_id TEXT,
  event_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('RECLAIM_PROCESSING','DEAD_LETTER_STALE','NOOP')),
  result TEXT NOT NULL CHECK (result IN ('APPLIED','SKIPPED','FAILED')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_consumer_recovery_actions_lookup
  ON trust_commerce_consumer_recovery_actions(consumer_id, created_at DESC);
