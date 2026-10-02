-- TRUST V240 — provider execution uniqueness and operational observability guards.
-- Migration 093 remains immutable.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_provider_create_job_payment
  ON trust_payment_provider_jobs(payment_id)
  WHERE kind='CREATE_PAYMENT' AND payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_provider_refund_job_refund
  ON trust_payment_provider_jobs(refund_id)
  WHERE kind='REFUND' AND refund_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trust_payment_provider_jobs_stuck
  ON trust_payment_provider_jobs(status, lease_until, updated_at)
  WHERE status='PROCESSING';
