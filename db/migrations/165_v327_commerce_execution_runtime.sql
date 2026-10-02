-- V327: durable standard-order execution state.
-- This is operational state, not an audit artifact: it is the state machine used
-- to connect payment capture, fulfillment, delivery and settlement release.
CREATE TABLE IF NOT EXISTS trust_commerce_execution_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES trust_orders(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES trust_payments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'CAPTURED' CHECK (status IN ('CAPTURED','FULFILLMENT_PLANNED','IN_FULFILLMENT','DELIVERED','SETTLEMENT_RELEASED','COMPLETED','BLOCKED','REFUNDED')),
  fulfillment_order_count integer NOT NULL DEFAULT 0 CHECK (fulfillment_order_count >= 0),
  delivered_fulfillment_order_count integer NOT NULL DEFAULT 0 CHECK (delivered_fulfillment_order_count >= 0),
  settlement_id uuid REFERENCES trust_marketplace_payment_settlements(id) ON DELETE SET NULL,
  last_error_code text,
  captured_at timestamptz NOT NULL DEFAULT now(),
  last_delivery_at timestamptz,
  settlement_released_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_commerce_execution_runs_status_idx ON trust_commerce_execution_runs(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS trust_commerce_execution_runs_payment_idx ON trust_commerce_execution_runs(payment_id);
