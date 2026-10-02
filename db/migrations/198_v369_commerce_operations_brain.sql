-- V369 — Unified Commerce Operations Brain.
-- Correlates publisher, consumer mesh, execution worker and queue state into one
-- durable operational snapshot. No customer/financial side effect is performed here.
CREATE TABLE IF NOT EXISTS trust_commerce_operations_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL CHECK (state IN ('HEALTHY','DEGRADED','CRITICAL','UNKNOWN')),
  publisher_state TEXT NOT NULL CHECK (publisher_state IN ('HEALTHY','DEGRADED','UNKNOWN')),
  consumer_state TEXT NOT NULL CHECK (consumer_state IN ('HEALTHY','DEGRADED','UNKNOWN')),
  execution_state TEXT NOT NULL CHECK (execution_state IN ('HEALTHY','DEGRADED','UNKNOWN')),
  ready_outbox_count INTEGER NOT NULL DEFAULT 0,
  outbox_processing_count INTEGER NOT NULL DEFAULT 0,
  outbox_dead_count INTEGER NOT NULL DEFAULT 0,
  execution_pending_count INTEGER NOT NULL DEFAULT 0,
  execution_processing_count INTEGER NOT NULL DEFAULT 0,
  execution_dead_count INTEGER NOT NULL DEFAULT 0,
  consumer_pending_count INTEGER NOT NULL DEFAULT 0,
  consumer_processing_count INTEGER NOT NULL DEFAULT 0,
  consumer_retrying_count INTEGER NOT NULL DEFAULT 0,
  consumer_dead_letter_count INTEGER NOT NULL DEFAULT 0,
  stale_consumer_delivery_count INTEGER NOT NULL DEFAULT 0,
  incident_count INTEGER NOT NULL DEFAULT 0,
  incidents JSONB NOT NULL DEFAULT '[]'::jsonb,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_operations_snapshots_time
  ON trust_commerce_operations_snapshots(observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_operations_snapshots_state
  ON trust_commerce_operations_snapshots(state, observed_at DESC);
