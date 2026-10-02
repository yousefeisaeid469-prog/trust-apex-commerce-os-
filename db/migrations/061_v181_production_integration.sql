-- V181 — real provider boundaries and durable fulfillment jobs.
CREATE TABLE IF NOT EXISTS trust_fulfillment_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
  provider text NOT NULL,
  status text NOT NULL CHECK(status IN ('created','failed')),
  provider_reference text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_fulfillment_jobs_order_idx ON trust_fulfillment_jobs(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS trust_fulfillment_jobs_provider_idx ON trust_fulfillment_jobs(provider, status, created_at DESC);
CREATE INDEX IF NOT EXISTS trust_payment_idempotency_idx ON trust_payments(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS trust_outbox_dispatch_idx ON trust_outbox_events(status, available_at, attempts, created_at);
ALTER TABLE trust_outbox_events ADD COLUMN IF NOT EXISTS locked_at timestamptz;
ALTER TABLE trust_outbox_events ADD COLUMN IF NOT EXISTS locked_by text;
