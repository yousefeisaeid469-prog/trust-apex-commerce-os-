-- V298 — Global Checkout Runtime Integration
-- Makes the V297 global commerce layer authoritative for a new checkout path.
ALTER TABLE trust_checkout_quotes
  ADD COLUMN IF NOT EXISTS destination_country text,
  ADD COLUMN IF NOT EXISTS locale text,
  ADD COLUMN IF NOT EXISTS settlement_currency text,
  ADD COLUMN IF NOT EXISTS shipping_mode text,
  ADD COLUMN IF NOT EXISTS fx_quote_json jsonb,
  ADD COLUMN IF NOT EXISTS tax_snapshot_json jsonb,
  ADD COLUMN IF NOT EXISTS global_pricing_json jsonb,
  ADD COLUMN IF NOT EXISTS pricing_version text;

ALTER TABLE trust_orders
  ADD COLUMN IF NOT EXISTS destination_country text,
  ADD COLUMN IF NOT EXISTS locale text,
  ADD COLUMN IF NOT EXISTS settlement_currency text,
  ADD COLUMN IF NOT EXISTS shipping_mode text,
  ADD COLUMN IF NOT EXISTS global_quote_id uuid REFERENCES trust_checkout_quotes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fx_quote_json jsonb,
  ADD COLUMN IF NOT EXISTS tax_snapshot_json jsonb,
  ADD COLUMN IF NOT EXISTS global_pricing_json jsonb,
  ADD COLUMN IF NOT EXISTS pricing_version text;

CREATE INDEX IF NOT EXISTS idx_trust_orders_global_checkout
  ON trust_orders(destination_country, settlement_currency, created_at DESC)
  WHERE destination_country IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_checkout_quotes_global_active
  ON trust_checkout_quotes(destination_country, settlement_currency, expires_at)
  WHERE consumed_at IS NULL AND destination_country IS NOT NULL;
