-- V177 Execution Adapter Mesh: provider routing, attempts, circuits and dead letters.
CREATE TABLE IF NOT EXISTS trust_execution_adapter_runs (
  command_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  adapter TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  provider_reference TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, command_id, adapter)
);
CREATE INDEX IF NOT EXISTS idx_trust_execution_adapter_runs_tenant ON trust_execution_adapter_runs(tenant_id, created_at DESC);
CREATE TABLE IF NOT EXISTS trust_execution_dead_letters (
  command_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  adapter TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, command_id, adapter)
);
CREATE INDEX IF NOT EXISTS idx_trust_execution_dead_letters_tenant ON trust_execution_dead_letters(tenant_id, created_at DESC);
