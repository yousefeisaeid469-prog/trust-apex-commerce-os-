-- V402 — Global Inventory Transaction Engine
-- One durable idempotency boundary for reserve/release/ship/inbound inventory mutations.
-- This is an audit/transaction authority, not another mutable stock counter.
CREATE TABLE IF NOT EXISTS trust_inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL CHECK(transaction_type IN ('RESERVE','RELEASE','SHIP','RETURN','INBOUND','ADJUSTMENT')),
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE RESTRICT,
  offer_id uuid REFERENCES trust_marketplace_offers(id) ON DELETE SET NULL,
  location_id uuid REFERENCES trust_fulfillment_locations(id) ON DELETE SET NULL,
  order_id uuid REFERENCES trust_orders(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES trust_inventory_reservations(id) ON DELETE SET NULL,
  fulfillment_order_id uuid REFERENCES trust_marketplace_fulfillment_orders(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK(quantity > 0),
  source text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_inventory_transactions_product
  ON trust_inventory_transactions(product_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_inventory_transactions_order
  ON trust_inventory_transactions(order_id,created_at DESC)
  WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trust_inventory_transactions_fulfillment
  ON trust_inventory_transactions(fulfillment_order_id,created_at DESC)
  WHERE fulfillment_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trust_inventory_transactions_location
  ON trust_inventory_transactions(location_id,product_id,created_at DESC)
  WHERE location_id IS NOT NULL;
COMMENT ON TABLE trust_inventory_transactions IS
  'V402 immutable transaction receipts and idempotency boundary for canonical inventory mutations.';
