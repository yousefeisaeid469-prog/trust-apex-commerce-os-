-- V394 Commerce Reconciliation & Recovery.
-- This migration adds durable bookkeeping and indexes for repairing interrupted
-- commerce transitions without creating a second source of truth.

CREATE TABLE IF NOT EXISTS trust_commerce_reconciliation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_kind text NOT NULL CHECK (candidate_kind IN (
    'CAPTURED_PAYMENT_MISSING_EXECUTION',
    'FULFILLMENT_NEEDS_RESUME',
    'FAILED_PAYMENT_RESERVATION_RELEASE'
  )),
  order_id uuid NOT NULL,
  payment_id uuid,
  execution_run_id uuid,
  status text NOT NULL DEFAULT 'STARTED' CHECK (status IN ('STARTED','SUCCEEDED','FAILED','SKIPPED')),
  idempotency_key text NOT NULL UNIQUE,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS trust_payments_captured_reconciliation_idx
  ON trust_payments(updated_at, id, order_id)
  WHERE status='captured';

CREATE INDEX IF NOT EXISTS trust_commerce_execution_reconciliation_idx
  ON trust_commerce_execution_runs(updated_at, id, order_id, status)
  WHERE status IN ('CAPTURED','BLOCKED','FULFILLMENT_PLANNED','IN_FULFILLMENT');

CREATE INDEX IF NOT EXISTS trust_inventory_reservations_failed_reconciliation_idx
  ON trust_inventory_reservations(order_id, status)
  WHERE status='reserved';

COMMENT ON TABLE trust_commerce_reconciliation_runs IS
  'V394 durable recovery ledger for interrupted commerce transitions; runtime remains PostgreSQL-authoritative.';
