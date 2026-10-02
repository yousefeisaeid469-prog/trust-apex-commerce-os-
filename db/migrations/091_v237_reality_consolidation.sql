-- V237 Reality Consolidation
-- Durable checkout quotes: quotes are state, not process memory.
CREATE TABLE IF NOT EXISTS trust_checkout_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_hash text NOT NULL,
  items_json jsonb NOT NULL,
  pricing_json jsonb NOT NULL,
  currency text NOT NULL DEFAULT 'EGP',
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
);
CREATE INDEX IF NOT EXISTS idx_checkout_quotes_active ON trust_checkout_quotes(expires_at) WHERE consumed_at IS NULL;
