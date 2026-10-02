-- TRUST V238 — Production reality hardening.
-- Preserve migration 091 immutability; add only forward-compatible changes here.
ALTER TABLE trust_checkout_quotes
  ADD COLUMN IF NOT EXISTS discount_code text;

CREATE INDEX IF NOT EXISTS idx_checkout_quotes_expiry
  ON trust_checkout_quotes(expires_at)
  WHERE consumed_at IS NULL;

ALTER TABLE trust_checkout_quotes
  ADD CONSTRAINT checkout_quotes_expiry_valid
  CHECK (expires_at > created_at);
