-- V361: operational indexes for restored legacy commerce runtimes.
-- Idempotent and additive; no existing data is rewritten.
CREATE INDEX IF NOT EXISTS idx_trust_consumer_subscriptions_event_enabled
  ON trust_consumer_subscriptions(event_type, enabled, consumer_id);
CREATE INDEX IF NOT EXISTS idx_trust_event_schema_versions_status
  ON trust_event_schema_versions(event_type, status, version);
CREATE INDEX IF NOT EXISTS idx_trust_agent_registry_tenant_agent
  ON trust_agent_registry(tenant_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_trust_autonomy_actions_tenant_time
  ON trust_autonomy_actions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_fraud_assessments_tenant_subject
  ON trust_fraud_assessments(tenant_id, subject_id, created_at DESC);
