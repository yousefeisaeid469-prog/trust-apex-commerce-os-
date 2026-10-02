-- V186 — provider webhook inbox, reconciliation and expired Guardian lease recovery.
CREATE TABLE IF NOT EXISTS trust_provider_webhook_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provider text NOT NULL,
 event_id text NOT NULL,
 event_type text NOT NULL,
 provider_reference text NOT NULL,
 occurred_at timestamptz NOT NULL,
 payload_json jsonb NOT NULL,
 status text NOT NULL CHECK(status IN ('RECEIVED','PROCESSED','REJECTED')),
 processed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provider,event_id)
);
CREATE INDEX IF NOT EXISTS idx_provider_webhook_status ON trust_provider_webhook_events(status,created_at);
CREATE INDEX IF NOT EXISTS idx_provider_webhook_reference ON trust_provider_webhook_events(provider,provider_reference,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guardian_expired_execution ON trust_purchase_guardian_actions(status,execution_lease_until) WHERE status='EXECUTING';
