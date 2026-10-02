-- V363: durable autonomous orchestration runtime contract indexes.
CREATE INDEX IF NOT EXISTS idx_trust_autonomous_orchestration_runs_status_updated
  ON trust_autonomous_orchestration_runs(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_autonomous_orchestration_runs_tenant_status
  ON trust_autonomous_orchestration_runs(tenant_id, status, updated_at DESC);
