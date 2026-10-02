-- V172 Digital Twin metadata primitives.
CREATE TABLE IF NOT EXISTS trust_twin_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_trust_twin_snapshots_tenant_time ON trust_twin_snapshots (tenant_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS trust_twin_scenarios (
  scenario_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  snapshot_id TEXT NOT NULL REFERENCES trust_twin_snapshots(snapshot_id),
  name TEXT NOT NULL,
  horizon_hours INTEGER NOT NULL CHECK (horizon_hours BETWEEN 1 AND 8760),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trust_twin_scenarios_tenant ON trust_twin_scenarios (tenant_id, created_at DESC);
