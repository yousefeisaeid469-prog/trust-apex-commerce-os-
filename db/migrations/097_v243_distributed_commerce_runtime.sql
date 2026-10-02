-- V243: bridge the transactional outbox into the durable event backbone.
-- Existing outbox rows remain replayable; publishing is idempotent via outbox:<id>.
ALTER TABLE trust_outbox_events ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE trust_outbox_events ADD COLUMN IF NOT EXISTS correlation_id TEXT;
ALTER TABLE trust_outbox_events ADD COLUMN IF NOT EXISTS causation_id TEXT;
ALTER TABLE trust_outbox_events ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE trust_outbox_events ADD COLUMN IF NOT EXISTS locked_by TEXT;
CREATE INDEX IF NOT EXISTS idx_trust_outbox_claim_v243 ON trust_outbox_events(status, available_at, created_at);
CREATE INDEX IF NOT EXISTS idx_trust_outbox_tenant_v243 ON trust_outbox_events(tenant_id, status, available_at);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_events_type_time_v243 ON trust_commerce_events(tenant_id, event_type, occurred_at DESC);
