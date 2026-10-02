-- V325: close the remaining settlement accounting edge cases.
-- Additive migration: preserves existing data and APIs.

ALTER TABLE trust_marketplace_payment_settlements
  ADD COLUMN IF NOT EXISTS merchandise_gross numeric(18,2);

UPDATE trust_marketplace_payment_settlements
SET merchandise_gross = COALESCE(merchandise_gross, seller_net + platform_fee + payment_fee + fulfillment_fee + return_fee)
WHERE merchandise_gross IS NULL;

ALTER TABLE trust_marketplace_payment_settlements
  ALTER COLUMN merchandise_gross SET DEFAULT 0;

ALTER TABLE trust_marketplace_payment_settlements
  DROP CONSTRAINT IF EXISTS trust_marketplace_payment_settlements_status_check;

ALTER TABLE trust_marketplace_payment_settlements
  ADD CONSTRAINT trust_marketplace_payment_settlements_status_check
  CHECK(status IN ('PENDING','RELEASED','REVERSED'));

