-- TRUST V301 — Global Order Fulfillment & Settlement Orchestration
-- Bridges successful global payment capture into the durable marketplace fulfillment network.
CREATE TABLE IF NOT EXISTS trust_global_order_orchestrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES trust_orders(id) ON DELETE RESTRICT,
  payment_id uuid REFERENCES trust_payments(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('CAPTURED','FULFILLMENT_PLANNED','IN_FULFILLMENT','DELIVERED','SETTLEMENT_RELEASED','COMPLETED','BLOCKED','REFUNDED')) DEFAULT 'CAPTURED',
  fulfillment_order_count integer NOT NULL DEFAULT 0 CHECK (fulfillment_order_count >= 0),
  settlement_id uuid REFERENCES trust_marketplace_payment_settlements(id) ON DELETE SET NULL,
  last_error_code text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_global_order_orchestrations_status ON trust_global_order_orchestrations(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_order_orchestrations_payment ON trust_global_order_orchestrations(payment_id) WHERE payment_id IS NOT NULL;

ALTER TABLE trust_marketplace_fulfillment_orders
  ADD COLUMN IF NOT EXISTS global_orchestration_id uuid REFERENCES trust_global_order_orchestrations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_marketplace_fulfillment_global_orchestration ON trust_marketplace_fulfillment_orders(global_orchestration_id) WHERE global_orchestration_id IS NOT NULL;
