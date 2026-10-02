-- TRUST V185 — durable Purchase Guardian execution state, leases and audit-safe invariants.
ALTER TABLE trust_purchase_guardian_actions ADD COLUMN IF NOT EXISTS execution_started_at TIMESTAMPTZ;
ALTER TABLE trust_purchase_guardian_actions ADD COLUMN IF NOT EXISTS execution_lease_until TIMESTAMPTZ;
ALTER TABLE trust_purchase_guardian_actions DROP CONSTRAINT IF EXISTS trust_purchase_guardian_actions_status_check;
ALTER TABLE trust_purchase_guardian_actions ADD CONSTRAINT trust_purchase_guardian_actions_status_check CHECK(status IN ('PROPOSED','APPROVAL_REQUIRED','APPROVED','EXECUTING','EXECUTED','FAILED'));
CREATE INDEX IF NOT EXISTS idx_guardian_actions_execution_lease ON trust_purchase_guardian_actions(status,execution_lease_until,updated_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_guardian_execution_attempt_action_status ON trust_purchase_guardian_execution_attempts(action_id,status) WHERE status='EXECUTED';
CREATE INDEX IF NOT EXISTS idx_guardian_outbox_action_events ON trust_outbox_events(event_type,aggregate_id,created_at DESC);
