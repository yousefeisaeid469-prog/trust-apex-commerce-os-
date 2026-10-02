-- V416 — Canonical Commerce Execution Path
-- A durable receipt proving that a production checkout crossed the V416 write
-- boundary. This is observability/audit state, not a second order authority.

CREATE TABLE IF NOT EXISTS trust_commerce_execution_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surface text NOT NULL CHECK (surface IN ('LOCAL_QUOTE','GLOBAL_QUOTE')),
  idempotency_key text NOT NULL,
  quote_id uuid,
  order_id uuid NOT NULL,
  customer_id uuid,
  status text NOT NULL CHECK (status IN ('COMMITTED')),
  contract_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(surface,idempotency_key)
);

CREATE INDEX IF NOT EXISTS trust_commerce_execution_receipts_order_idx
  ON trust_commerce_execution_receipts(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_commerce_execution_receipts_customer_idx
  ON trust_commerce_execution_receipts(customer_id,created_at DESC);

COMMENT ON TABLE trust_commerce_execution_receipts IS
  'V416 audit receipt proving a production checkout crossed the canonical commerce execution boundary; not an order/payment authority.';
