-- V241: safe scale-out foundations. Additive only; no prior migration is modified.
CREATE INDEX IF NOT EXISTS idx_trust_payment_provider_jobs_claim_v241
  ON trust_payment_provider_jobs (available_at, id)
  WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_trust_payment_provider_jobs_processing_recovery_v241
  ON trust_payment_provider_jobs (lease_until, id)
  WHERE status = 'PROCESSING' AND lease_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trust_outbox_events_dispatch_v241
  ON trust_outbox_events (status, available_at, created_at, id)
  WHERE status IN ('pending','processing');

CREATE INDEX IF NOT EXISTS idx_trust_webhook_events_processing_v241
  ON trust_webhook_events (state, received_at, id)
  WHERE state IN ('accepted','processing');

CREATE INDEX IF NOT EXISTS idx_trust_provider_webhook_events_processing_v241
  ON trust_provider_webhook_events (status, created_at, id)
  WHERE status = 'RECEIVED';
