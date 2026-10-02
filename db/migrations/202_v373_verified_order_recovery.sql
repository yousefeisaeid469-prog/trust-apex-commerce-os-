-- V373 — Verified order-scoped recovery.
-- Recovery is deliberately limited to stale consumer/execution leases belonging to one order.
-- It never mutates payment, inventory stock, settlement, revenue, or order state directly.
CREATE TABLE IF NOT EXISTS trust_commerce_reliability_recovery_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key text NOT NULL UNIQUE,
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  trace_id uuid NOT NULL REFERENCES trust_commerce_reliability_traces(id) ON DELETE CASCADE,
  trigger text NOT NULL,
  before_state text NOT NULL,
  before_root_cause text,
  after_state text NOT NULL,
  after_root_cause text,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  verified boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_commerce_reliability_recovery_runs_order_idx
  ON trust_commerce_reliability_recovery_runs(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_commerce_reliability_recovery_runs_trace_idx
  ON trust_commerce_reliability_recovery_runs(trace_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_commerce_reliability_recovery_runs_verified_idx
  ON trust_commerce_reliability_recovery_runs(verified,created_at DESC);
COMMENT ON TABLE trust_commerce_reliability_recovery_runs IS
  'V373: durable evidence for order-scoped stale-lease recovery and postcondition verification.';
