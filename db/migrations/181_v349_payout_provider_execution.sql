-- V349 — durable seller payout provider execution and idempotent settlement.
ALTER TABLE trust_payment_provider_jobs
  DROP CONSTRAINT IF EXISTS trust_payment_provider_jobs_kind_check;
ALTER TABLE trust_payment_provider_jobs
  ADD COLUMN IF NOT EXISTS payout_id uuid REFERENCES trust_marketplace_payout_requests(id) ON DELETE CASCADE;
ALTER TABLE trust_payment_provider_jobs
  ADD CONSTRAINT trust_payment_provider_jobs_kind_check
  CHECK (kind IN ('CREATE_PAYMENT','REFUND','PAYOUT'));
ALTER TABLE trust_payment_provider_jobs
  DROP CONSTRAINT IF EXISTS trust_payment_provider_jobs_check;
ALTER TABLE trust_payment_provider_jobs
  DROP CONSTRAINT IF EXISTS trust_payment_provider_jobs_target_check;
ALTER TABLE trust_payment_provider_jobs
  ADD CONSTRAINT trust_payment_provider_jobs_target_check
  CHECK ((kind='CREATE_PAYMENT' AND payment_id IS NOT NULL AND refund_id IS NULL AND payout_id IS NULL)
      OR (kind='REFUND' AND refund_id IS NOT NULL AND payment_id IS NULL AND payout_id IS NULL)
      OR (kind='PAYOUT' AND payout_id IS NOT NULL AND payment_id IS NULL AND refund_id IS NULL));
CREATE INDEX IF NOT EXISTS idx_trust_payment_provider_jobs_payout ON trust_payment_provider_jobs(payout_id) WHERE payout_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS trust_marketplace_payout_provider_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES trust_marketplace_payout_requests(id) ON DELETE CASCADE,
  provider text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  attempt_no integer NOT NULL CHECK(attempt_no>0),
  status text NOT NULL CHECK(status IN ('PROCESSING','SUCCEEDED','FAILED')),
  provider_reference text,
  failure_code text,
  raw_response_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(payout_id,attempt_no)
);
CREATE INDEX IF NOT EXISTS trust_payout_provider_attempts_payout_idx
  ON trust_marketplace_payout_provider_attempts(payout_id,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS trust_payout_provider_attempts_provider_ref_idx
  ON trust_marketplace_payout_provider_attempts(provider,provider_reference)
  WHERE provider_reference IS NOT NULL;

ALTER TABLE trust_marketplace_payout_requests
  ADD COLUMN IF NOT EXISTS provider_account_ref text,
  ADD COLUMN IF NOT EXISTS provider_job_id uuid REFERENCES trust_payment_provider_jobs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS trust_marketplace_payout_provider_job_idx
  ON trust_marketplace_payout_requests(provider_job_id);
