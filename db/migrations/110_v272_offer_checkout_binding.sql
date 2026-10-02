-- V272 — bind selected offer through cart and order pricing.
ALTER TABLE trust_cart_items ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES trust_marketplace_offers(id) ON DELETE SET NULL;
ALTER TABLE trust_order_items ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES trust_marketplace_offers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_trust_cart_items_offer ON trust_cart_items(offer_id);
CREATE INDEX IF NOT EXISTS idx_trust_order_items_offer ON trust_order_items(offer_id);
