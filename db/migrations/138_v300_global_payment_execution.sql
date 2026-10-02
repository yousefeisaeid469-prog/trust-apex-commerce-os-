-- TRUST V300 — Global Payment Execution + Order Lifecycle
-- Durable execution evidence for global payments. Provider adapters remain external boundaries.
CREATE TABLE IF NOT EXISTS trust_global_payment_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  global_payment_attempt_id uuid NOT NULL REFERENCES trust_global_payment_attempts(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
  payment_id uuid REFERENCES trust_payments(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('CREATED','PROVIDER_QUEUED','PROVIDER_PROCESSING','REQUIRES_ACTION','AUTHORIZED','CAPTURED','FAILED','CANCELLED','REFUNDED','PARTIALLY_REFUNDED')),
  provider text NOT NULL,
  provider_reference text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(global_payment_attempt_id,event_type,provider_reference)
);
CREATE INDEX IF NOT EXISTS idx_global_payment_lifecycle_attempt ON trust_global_payment_lifecycle_events(global_payment_attempt_id,occurred_at);
CREATE INDEX IF NOT EXISTS idx_global_payment_lifecycle_order ON trust_global_payment_lifecycle_events(order_id,occurred_at);

ALTER TABLE trust_global_payment_attempts
  ADD COLUMN IF NOT EXISTS provider_queued_at timestamptz,
  ADD COLUMN IF NOT EXISTS provider_processing_at timestamptz,
  ADD COLUMN IF NOT EXISTS authorized_at timestamptz,
  ADD COLUMN IF NOT EXISTS captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS failure_code text,
  ADD COLUMN IF NOT EXISTS execution_attempts integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_global_payment_attempts_execution ON trust_global_payment_attempts(status,updated_at);
