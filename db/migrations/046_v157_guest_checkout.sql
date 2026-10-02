-- V157 — Guest checkout
-- The single biggest reason a first-time visitor from an ad abandons a
-- purchase: being forced to create a password account before they can
-- even see if buying is easy. Cash-on-delivery needs no stored payment
-- credential, so it needs no account either — just a name, phone, and
-- address to deliver to. Logged-in checkout still works exactly as before;
-- this only adds a second, lighter path.

ALTER TABLE trust_orders ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE trust_orders ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE trust_orders ADD COLUMN IF NOT EXISTS guest_phone text;
ALTER TABLE trust_orders ADD COLUMN IF NOT EXISTS guest_address text;
ALTER TABLE trust_orders ADD CONSTRAINT trust_orders_buyer_identity_check
  CHECK (customer_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_phone IS NOT NULL AND guest_address IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_trust_orders_guest_phone ON trust_orders(guest_phone) WHERE guest_phone IS NOT NULL;
