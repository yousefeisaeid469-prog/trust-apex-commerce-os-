-- V370 — Unified Commerce Command Center.
-- Provides a durable operational view over V369. It classifies evidence-backed
-- incidents and proposes bounded recovery actions; it does not mutate money,
-- inventory ownership, customer balances, payments or order state.
CREATE TABLE IF NOT EXISTS trust_commerce_command_center_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL CHECK (state IN ('HEALTHY','DEGRADED','CRITICAL','UNKNOWN')),
  pipeline JSONB NOT NULL DEFAULT '{}'::jsonb,
  workers JSONB NOT NULL DEFAULT '{}'::jsonb,
  incidents JSONB NOT NULL DEFAULT '[]'::jsonb,
  root_causes JSONB NOT NULL DEFAULT '[]'::jsonb,
  recovery_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  recent_failures JSONB NOT NULL DEFAULT '[]'::jsonb,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_command_center_snapshots_time
  ON trust_commerce_command_center_snapshots(observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_command_center_snapshots_state
  ON trust_commerce_command_center_snapshots(state, observed_at DESC);
