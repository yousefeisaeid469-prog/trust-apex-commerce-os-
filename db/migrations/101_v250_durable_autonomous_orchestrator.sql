-- V250: make the autonomous commerce orchestrator durable across processes.
-- The API persists an orchestration run and appends the command event atomically;
-- the existing durable commerce consumer mesh executes it asynchronously.
CREATE TABLE IF NOT EXISTS trust_autonomous_orchestration_runs (
  tenant_id TEXT NOT NULL,
  run_id UUID NOT NULL,
  event_id UUID NOT NULL,
  aggregate_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACCEPTED','PROCESSING','COMPLETED','RETRYING','FAILED')),
  event_type TEXT NOT NULL,
  policy JSONB,
  runtime_options JSONB,
  result JSONB,
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, run_id),
  UNIQUE (tenant_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_trust_autonomous_orchestration_runs_status_v250
  ON trust_autonomous_orchestration_runs(tenant_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_autonomous_orchestration_runs_event_v250
  ON trust_autonomous_orchestration_runs(tenant_id, event_id);

INSERT INTO trust_consumer_subscriptions(consumer_id,event_type,enabled,contract_version,max_attempts)
VALUES ('autonomous-commerce-orchestrator','*',TRUE,1,8)
ON CONFLICT (consumer_id,event_type) DO UPDATE
SET enabled=EXCLUDED.enabled, contract_version=EXCLUDED.contract_version, max_attempts=EXCLUDED.max_attempts, updated_at=now();
