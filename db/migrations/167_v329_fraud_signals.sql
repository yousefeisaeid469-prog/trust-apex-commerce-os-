-- V329 — Rule-based fraud signals. Deterministic, explainable rules scored
-- against every committed order; advisory only (never blocks checkout).
-- Confirmed before writing this: no fraud/risk table exists anywhere in the
-- schema, and the two files that mention "risk" (v313/risk/core.ts,
-- v314/risk/core.ts) are 3-4 line orphans with zero references anywhere —
-- this is genuinely new work, not a duplicate.

CREATE TABLE IF NOT EXISTS trust_fraud_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  rule_code text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH')),
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','REVIEWED_OK','REVIEWED_BLOCKED')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_fraud_signals_order ON trust_fraud_signals(order_id);
CREATE INDEX IF NOT EXISTS idx_trust_fraud_signals_open ON trust_fraud_signals(status, created_at DESC) WHERE status = 'OPEN';
