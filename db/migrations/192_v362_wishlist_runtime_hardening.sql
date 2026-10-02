-- V362 — Wishlist runtime hardening.
-- The live wishlist path is trust_wishlists/trust_wishlist_items. These indexes
-- support the authenticated list and check-then-insert mutation without changing
-- the nullable-variant uniqueness semantics of the existing data model.
CREATE INDEX IF NOT EXISTS idx_trust_wishlists_customer_created
  ON trust_wishlists(customer_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_trust_wishlist_items_wishlist_product
  ON trust_wishlist_items(wishlist_id, product_id, added_at DESC);
