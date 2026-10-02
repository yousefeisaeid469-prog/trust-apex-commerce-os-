-- V289 — FBA-like inventory custody, warehouse economics and dispatch execution.
ALTER TABLE trust_marketplace_inventory_movements DROP CONSTRAINT IF EXISTS trust_marketplace_inventory_movements_movement_type_check;
ALTER TABLE trust_marketplace_inventory_movements ADD CONSTRAINT trust_marketplace_inventory_movements_movement_type_check CHECK(movement_type IN ('INBOUND_RECEIPT','DAMAGE','DAMAGE_RECOVERY','ADJUSTMENT','PICK','SHIP','RETURN_RECEIPT','STORAGE_ADJUSTMENT'));

CREATE TABLE IF NOT EXISTS trust_marketplace_fulfillment_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES trust_marketplace_fulfillment_programs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','PAUSED','TERMINATED')),
  service_level text NOT NULL DEFAULT 'STANDARD' CHECK(service_level IN ('STANDARD','EXPRESS','PREMIUM')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(merchant_id,program_id)
);

CREATE TABLE IF NOT EXISTS trust_marketplace_inventory_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fulfillment_order_id uuid NOT NULL REFERENCES trust_marketplace_fulfillment_orders(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE RESTRICT,
  location_id uuid NOT NULL REFERENCES trust_fulfillment_locations(id) ON DELETE RESTRICT,
  offer_id uuid REFERENCES trust_marketplace_offers(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK(quantity > 0),
  status text NOT NULL DEFAULT 'RESERVED' CHECK(status IN ('RESERVED','PICKED','SHIPPED','RELEASED','CANCELLED')),
  source text NOT NULL DEFAULT 'CHECKOUT' CHECK(source IN ('CHECKOUT','MANUAL','REPLENISHMENT')),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fulfillment_order_id,location_id,offer_id,product_id)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_inventory_reservations_status ON trust_marketplace_inventory_reservations(location_id,status,updated_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_fulfillment_cost_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE RESTRICT,
  fulfillment_order_id uuid REFERENCES trust_marketplace_fulfillment_orders(id) ON DELETE SET NULL,
  program_id uuid REFERENCES trust_marketplace_fulfillment_programs(id) ON DELETE SET NULL,
  cost_type text NOT NULL CHECK(cost_type IN ('STORAGE','PICK_PACK','SHIPPING','RETURN')),
  quantity numeric(18,4) NOT NULL CHECK(quantity >= 0),
  unit_rate numeric(18,4) NOT NULL CHECK(unit_rate >= 0),
  amount numeric(18,2) NOT NULL CHECK(amount >= 0),
  currency text NOT NULL DEFAULT 'EGP',
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_fulfillment_cost_ledger_merchant ON trust_marketplace_fulfillment_cost_ledger(merchant_id,created_at DESC);
