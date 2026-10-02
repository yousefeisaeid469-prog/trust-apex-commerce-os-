-- V332 — Bind checkout quotes to their creator and harden replay isolation.
-- A quote ID is not a bearer credential: authenticated quotes must belong to the
-- authenticated customer that is consuming them.
ALTER TABLE trust_checkout_quotes
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES trust_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_checkout_quotes_customer_active
  ON trust_checkout_quotes(customer_id, expires_at)
  WHERE consumed_at IS NULL;

-- Keep the request-hash cache scoped by customer so two customers can never
-- accidentally share an authenticated quote created from identical cart input.
CREATE INDEX IF NOT EXISTS idx_checkout_quotes_customer_request_hash
  ON trust_checkout_quotes(customer_id, request_hash, expires_at)
  WHERE consumed_at IS NULL;
