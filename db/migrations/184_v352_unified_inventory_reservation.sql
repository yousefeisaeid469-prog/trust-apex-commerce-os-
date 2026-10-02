-- V352 — Unified Inventory Reservation Authority
-- Every checkout path now uses the same transactional reservation primitive.
-- This prevents global checkout from bypassing the V328 reservation lifecycle.

CREATE INDEX IF NOT EXISTS trust_inventory_reservations_order_offer_idx
  ON trust_inventory_reservations(order_id, offer_id, product_id, status);

CREATE INDEX IF NOT EXISTS trust_inventory_reservations_location_idx
  ON trust_inventory_reservations(offer_id, location_id, product_id, status)
  WHERE offer_id IS NOT NULL AND location_id IS NOT NULL;

COMMENT ON TABLE trust_inventory_reservations IS
  'Durable inventory holds/consumption. V352 makes this table the single checkout reservation authority.';
