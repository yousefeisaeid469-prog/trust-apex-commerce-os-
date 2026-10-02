-- V288 — durable FBA-like fulfillment execution and warehouse custody.
-- Physical custody is separated from customer-facing shipment tracking and from seller money.
ALTER TABLE trust_fulfillment_inventory
  ADD COLUMN IF NOT EXISTS on_hand_units integer NOT NULL DEFAULT 0 CHECK(on_hand_units >= 0),
  ADD COLUMN IF NOT EXISTS damaged_units integer NOT NULL DEFAULT 0 CHECK(damaged_units >= 0),
  ADD COLUMN IF NOT EXISTS inbound_units integer NOT NULL DEFAULT 0 CHECK(inbound_units >= 0);

CREATE TABLE IF NOT EXISTS trust_marketplace_fulfillment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  order_shipment_id uuid NOT NULL REFERENCES trust_order_shipments(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE RESTRICT,
  location_id uuid REFERENCES trust_fulfillment_locations(id) ON DELETE SET NULL,
  program_code text NOT NULL CHECK(program_code IN ('PLATFORM_FULFILLMENT','MULTICHANNEL_FULFILLMENT','SELLER_FULFILLED')),
  status text NOT NULL DEFAULT 'PLANNED' CHECK(status IN ('PLANNED','PICKING','PACKED','READY_FOR_HANDOFF','HANDED_OFF','DELIVERED','EXCEPTION','CANCELLED')),
  shipment_id uuid REFERENCES trust_shipments(id) ON DELETE SET NULL,
  item_count integer NOT NULL CHECK(item_count > 0),
  min_days integer NOT NULL CHECK(min_days >= 0),
  max_days integer NOT NULL CHECK(max_days >= min_days),
  destination_region text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  planned_at timestamptz NOT NULL DEFAULT now(),
  packed_at timestamptz,
  handed_off_at timestamptz,
  delivered_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_fulfillment_order_shipment ON trust_marketplace_fulfillment_orders(order_shipment_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_fulfillment_orders_status ON trust_marketplace_fulfillment_orders(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_fulfillment_orders_merchant ON trust_marketplace_fulfillment_orders(merchant_id,status,updated_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_fulfillment_custody (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fulfillment_order_id uuid NOT NULL REFERENCES trust_marketplace_fulfillment_orders(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE RESTRICT,
  location_id uuid REFERENCES trust_fulfillment_locations(id) ON DELETE SET NULL,
  offer_id uuid REFERENCES trust_marketplace_offers(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK(quantity > 0),
  status text NOT NULL DEFAULT 'RECEIVED' CHECK(status IN ('RECEIVED','PICKED','PACKED','HANDED_OFF','RELEASED','EXCEPTION')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fulfillment_order_id,offer_id,product_id)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_fulfillment_custody_status ON trust_marketplace_fulfillment_custody(status,updated_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_fulfillment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fulfillment_order_id uuid NOT NULL REFERENCES trust_marketplace_fulfillment_orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  actor_id uuid,
  event_key text NOT NULL UNIQUE,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_fulfillment_events_order ON trust_marketplace_fulfillment_events(fulfillment_order_id,created_at);

CREATE TABLE IF NOT EXISTS trust_marketplace_inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES trust_fulfillment_locations(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES trust_marketplace_offers(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE RESTRICT,
  movement_type text NOT NULL CHECK(movement_type IN ('INBOUND_RECEIPT','DAMAGE','DAMAGE_RECOVERY','ADJUSTMENT')),
  quantity integer NOT NULL CHECK(quantity <> 0),
  reference_key text NOT NULL UNIQUE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_inventory_movements_location_product ON trust_marketplace_inventory_movements(location_id,product_id,created_at DESC);
