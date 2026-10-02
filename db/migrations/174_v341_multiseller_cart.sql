-- V341 — Multi-seller cart identity.
-- A cart line is identified by (product, offer), not product alone.
-- This allows one customer to hold two seller offers for the same catalog product.
ALTER TABLE trust_cart_items ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
UPDATE trust_cart_items SET id=gen_random_uuid() WHERE id IS NULL;
ALTER TABLE trust_cart_items ALTER COLUMN id SET NOT NULL;
ALTER TABLE trust_cart_items DROP CONSTRAINT IF EXISTS trust_cart_items_pkey;
ALTER TABLE trust_cart_items ADD CONSTRAINT trust_cart_items_pkey PRIMARY KEY (id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_trust_cart_items_product_offer
  ON trust_cart_items(cart_id, product_id, COALESCE(offer_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX IF NOT EXISTS idx_trust_cart_items_cart_product_offer
  ON trust_cart_items(cart_id, product_id, offer_id);
