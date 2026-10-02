-- TRUST V299 — Global Payment Runtime
-- Makes global order payment state durable and binds payment attempts to the
-- country/currency/method/provider selected by the authoritative order.
CREATE TABLE IF NOT EXISTS trust_global_payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
  payment_id uuid REFERENCES trust_payments(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL,
  destination_country text NOT NULL,
  currency text NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('card','cod','wallet','bank_transfer')),
  provider text NOT NULL,
  status text NOT NULL CHECK (status IN ('created','pending','requires_action','authorized','captured','failed','cancelled','refunded','partially_refunded')) DEFAULT 'created',
  provider_reference text,
  client_secret text,
  idempotency_key text NOT NULL UNIQUE,
  request_hash text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, payment_method, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_global_payment_attempts_order ON trust_global_payment_attempts(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_payment_attempts_provider_ref ON trust_global_payment_attempts(provider, provider_reference) WHERE provider_reference IS NOT NULL;

ALTER TABLE trust_payments ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE trust_payments ADD COLUMN IF NOT EXISTS destination_country text;
ALTER TABLE trust_payments ADD COLUMN IF NOT EXISTS global_payment_attempt_id uuid REFERENCES trust_global_payment_attempts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_trust_payments_global_attempt ON trust_payments(global_payment_attempt_id) WHERE global_payment_attempt_id IS NOT NULL;
