-- V353 — durable fulfillment allocation authority.
-- Every checkout reservation is bound to its exact order item, then exactly once
-- allocated to a fulfillment order/location. Fulfillment execution advances the
-- allocation state instead of relying on reconstructed joins at runtime.

ALTER TABLE trust_inventory_reservations
  ADD COLUMN IF NOT EXISTS order_item_id uuid REFERENCES trust_order_items(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS trust_inventory_reservations_order_item_uq
  ON trust_inventory_reservations(order_item_id)
  WHERE order_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS trust_inventory_reservations_order_item_idx
  ON trust_inventory_reservations(order_id,order_item_id,status);

CREATE TABLE IF NOT EXISTS trust_fulfillment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fulfillment_order_id uuid NOT NULL REFERENCES trust_marketplace_fulfillment_orders(id) ON DELETE CASCADE,
  reservation_id uuid NOT NULL UNIQUE REFERENCES trust_inventory_reservations(id) ON DELETE RESTRICT,
  order_item_id uuid NOT NULL REFERENCES trust_order_items(id) ON DELETE RESTRICT,
  seller_order_id uuid REFERENCES trust_seller_orders(id) ON DELETE SET NULL,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE RESTRICT,
  location_id uuid REFERENCES trust_fulfillment_locations(id) ON DELETE SET NULL,
  offer_id uuid REFERENCES trust_marketplace_offers(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK(quantity > 0),
  status text NOT NULL DEFAULT 'ALLOCATED' CHECK(status IN ('ALLOCATED','PICKED','PACKED','HANDED_OFF','DELIVERED','RELEASED','EXPIRED','CANCELLED','EXCEPTION')),
  idempotency_key text NOT NULL UNIQUE,
  allocated_at timestamptz NOT NULL DEFAULT now(),
  picked_at timestamptz,
  packed_at timestamptz,
  handed_off_at timestamptz,
  delivered_at timestamptz,
  released_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fulfillment_order_id,reservation_id)
);

CREATE INDEX IF NOT EXISTS trust_fulfillment_allocations_order_status_idx
  ON trust_fulfillment_allocations(fulfillment_order_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS trust_fulfillment_allocations_seller_order_idx
  ON trust_fulfillment_allocations(seller_order_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS trust_fulfillment_allocations_location_idx
  ON trust_fulfillment_allocations(location_id,offer_id,product_id,status);

-- Reservation release/expiry must never leave a phantom active allocation.
CREATE OR REPLACE FUNCTION trust_sync_fulfillment_allocation_reservation_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'released' THEN
    UPDATE trust_fulfillment_allocations
       SET status='RELEASED', released_at=coalesce(released_at,now()), updated_at=now()
     WHERE reservation_id=NEW.id
       AND status NOT IN ('DELIVERED','RELEASED','EXPIRED','CANCELLED');
  ELSIF NEW.status = 'expired' THEN
    UPDATE trust_fulfillment_allocations
       SET status='EXPIRED', released_at=coalesce(released_at,now()), updated_at=now()
     WHERE reservation_id=NEW.id
       AND status NOT IN ('DELIVERED','RELEASED','EXPIRED','CANCELLED');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trust_inventory_reservation_allocation_sync
  ON trust_inventory_reservations;
CREATE TRIGGER trust_inventory_reservation_allocation_sync
AFTER UPDATE OF status ON trust_inventory_reservations
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION trust_sync_fulfillment_allocation_reservation_status();

COMMENT ON TABLE trust_fulfillment_allocations IS
  'V353: single durable binding between inventory reservation, order item, seller order, fulfillment order and fulfillment location.';
