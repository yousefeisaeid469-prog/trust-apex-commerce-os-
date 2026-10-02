-- V334 — cancellation must restore the exact inventory bucket reserved at checkout.
-- The cancellation path previously updated trust_products directly and marked
-- every reservation for the same product as released. That could double-release
-- duplicate product reservations and could fail to restore marketplace-offer /
-- fulfillment-location inventory.
-- Runtime logic is row-id scoped and reuses the canonical reservation restore path.
CREATE INDEX IF NOT EXISTS idx_trust_inventory_reservations_cancel_order_status
  ON trust_inventory_reservations(order_id, status, id);
