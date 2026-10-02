-- TRUST V132 — transactional hardening: request fingerprints, lease ownership,
-- payment event race safety, and operational retention indexes.
-- NOTE (V154 fix): trust_idempotency_keys did not exist yet at this point
-- in the sequence — its request_hash column and this index are now part
-- of its CREATE TABLE in 044_v154_missing_transactional_core.sql. Fixed
-- pre-deployment; no live database ever ran this migration set.

ALTER TABLE trust_jobs ADD COLUMN IF NOT EXISTS lease_token text;
CREATE INDEX IF NOT EXISTS trust_jobs_recovery_idx ON trust_jobs(state,locked_until) WHERE state='RUNNING';

ALTER TABLE trust_payment_intents ADD COLUMN IF NOT EXISTS amount_cents bigint;
UPDATE trust_payment_intents SET amount_cents=round(amount*100) WHERE amount_cents IS NULL;
ALTER TABLE trust_payment_intents ALTER COLUMN amount_cents SET NOT NULL;
ALTER TABLE trust_payment_intents ADD CONSTRAINT trust_payment_intents_amount_cents_positive CHECK(amount_cents>0);

ALTER TABLE trust_payments DROP CONSTRAINT IF EXISTS trust_payments_amount_check;
ALTER TABLE trust_payments ADD CONSTRAINT trust_payments_amount_positive CHECK(amount>0);

-- NOTE (V154 fix): trust_payment_events did not exist yet either — its
-- race index now lives alongside its CREATE TABLE in 044.
CREATE INDEX IF NOT EXISTS trust_refunds_idempotency_idx ON trust_refunds(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS trust_outbox_processing_idx ON trust_outbox_events(status,available_at,attempts);
