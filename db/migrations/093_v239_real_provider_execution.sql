-- TRUST V239 — durable provider execution state for payments/refunds.
CREATE TABLE IF NOT EXISTS trust_payment_provider_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK(kind IN ('CREATE_PAYMENT','REFUND')),
  payment_id uuid REFERENCES trust_payments(id) ON DELETE CASCADE,
  refund_id uuid REFERENCES trust_refunds(id) ON DELETE CASCADE,
  provider text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','PROCESSING','DONE','FAILED')),
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  last_error text,
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind='CREATE_PAYMENT' AND payment_id IS NOT NULL AND refund_id IS NULL) OR (kind='REFUND' AND refund_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_trust_payment_provider_jobs_ready ON trust_payment_provider_jobs(status,available_at,lease_until);
CREATE INDEX IF NOT EXISTS idx_trust_payment_provider_jobs_payment ON trust_payment_provider_jobs(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trust_payment_provider_jobs_refund ON trust_payment_provider_jobs(refund_id) WHERE refund_id IS NOT NULL;
