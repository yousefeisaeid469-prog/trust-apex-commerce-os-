-- V326 — Complete the operational commerce journey without adding another audit layer.
-- Adds durable COD capture records and indexes used by the runtime journey API.

CREATE TABLE IF NOT EXISTS trust_cod_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
  payment_id uuid REFERENCES trust_payments(id) ON DELETE SET NULL,
  amount numeric(18,2) NOT NULL CHECK(amount > 0),
  currency char(3) NOT NULL,
  status text NOT NULL CHECK(status IN ('PENDING','COLLECTED','FAILED','REVERSED')) DEFAULT 'PENDING',
  collected_at timestamptz,
  collector_reference text,
  idempotency_key text NOT NULL UNIQUE,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS trust_cod_collections_status_idx
  ON trust_cod_collections(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS trust_marketplace_fulfillment_orders_order_idx
  ON trust_marketplace_fulfillment_orders(order_id, created_at ASC);

CREATE INDEX IF NOT EXISTS trust_marketplace_payment_settlements_payment_status_idx
  ON trust_marketplace_payment_settlements(payment_id, status);
