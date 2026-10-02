-- TRUST V302 — Global Fulfillment Execution + Delivery Completion + Settlement Release
-- Durable execution evidence and aggregate delivery gates for split global orders.
CREATE TABLE IF NOT EXISTS trust_global_order_execution_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orchestration_id uuid NOT NULL REFERENCES trust_global_order_orchestrations(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
  trigger_key text NOT NULL UNIQUE,
  trigger_type text NOT NULL CHECK (trigger_type IN ('SHIPMENT_DELIVERED','FULFILLMENT_DELIVERED','RECONCILIATION')),
  status text NOT NULL CHECK (status IN ('RUNNING','WAITING','COMPLETED','BLOCKED')) DEFAULT 'RUNNING',
  total_fulfillment_orders integer NOT NULL DEFAULT 0 CHECK (total_fulfillment_orders >= 0),
  delivered_fulfillment_orders integer NOT NULL DEFAULT 0 CHECK (delivered_fulfillment_orders >= 0),
  settlement_release_id uuid REFERENCES trust_marketplace_balance_releases(id) ON DELETE SET NULL,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_global_order_execution_runs_order ON trust_global_order_execution_runs(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_order_execution_runs_orchestration ON trust_global_order_execution_runs(orchestration_id, created_at DESC);

ALTER TABLE trust_global_order_orchestrations
  ADD COLUMN IF NOT EXISTS delivered_fulfillment_order_count integer NOT NULL DEFAULT 0 CHECK (delivered_fulfillment_order_count >= 0),
  ADD COLUMN IF NOT EXISTS last_delivery_at timestamptz,
  ADD COLUMN IF NOT EXISTS settlement_released_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS uq_global_fulfillment_orchestration_order ON trust_marketplace_fulfillment_orders(global_orchestration_id, order_id, order_shipment_id) WHERE global_orchestration_id IS NOT NULL;
