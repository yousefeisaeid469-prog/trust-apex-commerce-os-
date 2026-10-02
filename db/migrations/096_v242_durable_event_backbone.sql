-- V242 Durable Event Backbone: idempotency, delivery leases and hot-path indexes.
ALTER TABLE trust_commerce_events ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
UPDATE trust_commerce_events SET idempotency_key = event_id WHERE idempotency_key IS NULL;
ALTER TABLE trust_commerce_events ALTER COLUMN idempotency_key SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_trust_commerce_events_idempotency ON trust_commerce_events(tenant_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_events_aggregate_sequence ON trust_commerce_events(tenant_id, aggregate_id, sequence_no);

ALTER TABLE trust_event_deliveries ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE trust_event_deliveries ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE trust_event_deliveries ADD COLUMN IF NOT EXISTS locked_by TEXT;
ALTER TABLE trust_event_deliveries ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_trust_event_deliveries_claim ON trust_event_deliveries(consumer_id, status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_trust_event_dead_letters_time ON trust_event_dead_letters(tenant_id, created_at DESC);
