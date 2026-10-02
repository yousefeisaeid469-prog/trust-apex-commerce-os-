-- V371 — Verified Commerce Recovery Loop.
-- Records bounded automatic recovery attempts and their post-recovery observation.
-- This table is operational evidence only; it does not mutate financial/customer state.
CREATE TABLE IF NOT EXISTS trust_commerce_recovery_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key TEXT NOT NULL UNIQUE,
  trigger TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('VERIFIED','UNVERIFIED')),
  before_state TEXT NOT NULL CHECK (before_state IN ('HEALTHY','DEGRADED','CRITICAL','UNKNOWN')),
  after_state TEXT NOT NULL CHECK (after_state IN ('HEALTHY','DEGRADED','CRITICAL','UNKNOWN')),
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_recovery_runs_created
  ON trust_commerce_recovery_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_recovery_runs_state
  ON trust_commerce_recovery_runs(state, created_at DESC);
