-- V354 — Fulfillment execution becomes inventory-real.
-- A fulfillment handoff must consume the exact allocation exactly once.

ALTER TABLE trust_marketplace_inventory_movements
  DROP CONSTRAINT IF EXISTS trust_marketplace_inventory_movements_movement_type_check;

ALTER TABLE trust_marketplace_inventory_movements
  ADD CONSTRAINT trust_marketplace_inventory_movements_movement_type_check
  CHECK(movement_type IN ('INBOUND_RECEIPT','DAMAGE','DAMAGE_RECOVERY','ADJUSTMENT','SHIP'));

CREATE TABLE IF NOT EXISTS trust_fulfillment_inventory_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id uuid NOT NULL REFERENCES trust_fulfillment_allocations(id) ON DELETE RESTRICT,
  fulfillment_order_id uuid NOT NULL REFERENCES trust_marketplace_fulfillment_orders(id) ON DELETE RESTRICT,
  reservation_id uuid NOT NULL REFERENCES trust_inventory_reservations(id) ON DELETE RESTRICT,
  location_id uuid NOT NULL REFERENCES trust_fulfillment_locations(id) ON DELETE RESTRICT,
  offer_id uuid REFERENCES trust_marketplace_offers(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK(quantity > 0),
  execution_type text NOT NULL CHECK(execution_type IN ('HANDOFF_SHIP')),
  idempotency_key text NOT NULL UNIQUE,
  inventory_movement_id uuid REFERENCES trust_marketplace_inventory_movements(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(allocation_id, execution_type)
);

CREATE INDEX IF NOT EXISTS trust_fulfillment_inventory_executions_order_idx
  ON trust_fulfillment_inventory_executions(fulfillment_order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS trust_fulfillment_inventory_executions_product_idx
  ON trust_fulfillment_inventory_executions(location_id, product_id, offer_id, created_at DESC);

COMMENT ON TABLE trust_fulfillment_inventory_executions IS
  'V354: immutable execution receipt proving an allocation consumed physical fulfillment inventory exactly once at handoff.';
