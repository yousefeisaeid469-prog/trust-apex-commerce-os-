-- V324 — Activate existing customer retention capabilities with durable commerce-derived mutations.
-- Additive: no existing data or APIs are removed.
CREATE INDEX IF NOT EXISTS idx_marketplace_loyalty_ledger_customer_reason
  ON trust_marketplace_loyalty_ledger(customer_id,reason,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_wishlists_product
  ON trust_marketplace_wishlists(product_id,created_at DESC);
