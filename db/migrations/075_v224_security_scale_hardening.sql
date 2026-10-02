-- V224 — targeted indexes for high-contention order cancellation and inventory release.
CREATE INDEX IF NOT EXISTS idx_trust_inventory_reservations_order_status
  ON trust_inventory_reservations(order_id,status);
CREATE INDEX IF NOT EXISTS idx_trust_inventory_ledger_product_reference
  ON trust_inventory_ledger(product_id,reference_id);
