-- V355 — Commerce Execution Kernel.
-- Durable step state for the real order execution path. This is operational state:
-- workers/retries can resume from the last committed step without replaying money,
-- inventory or fulfillment side effects.
CREATE TABLE IF NOT EXISTS trust_commerce_execution_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_run_id uuid NOT NULL REFERENCES trust_commerce_execution_runs(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  step_code text NOT NULL CHECK (step_code IN ('CAPTURE','FULFILLMENT_PREPARE','FULFILLMENT_PROGRESS','DELIVERY_FINALIZE','SETTLEMENT_RELEASE','COMPLETE')),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','SUCCEEDED','BLOCKED','FAILED')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  idempotency_key text NOT NULL UNIQUE,
  started_at timestamptz,
  completed_at timestamptz,
  last_error_code text,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(execution_run_id, step_code)
);

CREATE INDEX IF NOT EXISTS trust_commerce_execution_steps_order_idx
  ON trust_commerce_execution_steps(order_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS trust_commerce_execution_steps_recovery_idx
  ON trust_commerce_execution_steps(status, updated_at ASC)
  WHERE status IN ('RUNNING','BLOCKED','FAILED');

COMMENT ON TABLE trust_commerce_execution_steps IS
  'V355: durable operational step ledger for resumable commerce execution; not an audit-only artifact.';
