-- V176 Autonomous Execution Mesh: durable command/receipt/rollback audit primitives.
CREATE TABLE IF NOT EXISTS trust_execution_commands (
  command_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  action TEXT NOT NULL,
  risk_bps INTEGER NOT NULL CHECK (risk_bps BETWEEN 0 AND 10000),
  budget_minor NUMERIC,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trust_execution_commands_tenant ON trust_execution_commands(tenant_id, created_at DESC);
CREATE TABLE IF NOT EXISTS trust_execution_receipts (
  receipt_id TEXT PRIMARY KEY,
  command_id TEXT NOT NULL UNIQUE REFERENCES trust_execution_commands(command_id),
  tenant_id TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  status TEXT NOT NULL,
  rollback_token TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_trust_execution_receipts_tenant ON trust_execution_receipts(tenant_id, executed_at DESC);
