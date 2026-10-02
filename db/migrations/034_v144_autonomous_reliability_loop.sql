CREATE TABLE IF NOT EXISTS trust_v144_runtime_incidents (
  incident_id TEXT PRIMARY KEY,
  severity TEXT NOT NULL CHECK (severity IN ('SEV1','SEV2','SEV3')),
  service_id TEXT NOT NULL,
  tenant_id TEXT,
  rollout_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('OPEN','MITIGATING','RECOVERED','ROLLED_BACK','ESCALATED')),
  blast_radius JSONB NOT NULL,
  signal JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS trust_v144_runtime_enforcement_receipts (
  id BIGSERIAL PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES trust_v144_runtime_incidents(incident_id),
  action TEXT NOT NULL CHECK (action IN ('OPEN_INCIDENT','FREEZE_ROLLOUT','ISOLATE_SERVICE','ISOLATE_TENANT','MITIGATE','ROLLBACK','RESUME_ROLLOUT','ESCALATE')),
  target TEXT NOT NULL,
  accepted BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  evidence_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_v144_reliability_loop_runs (
  run_id UUID PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES trust_v144_runtime_incidents(incident_id),
  decision TEXT NOT NULL CHECK (decision IN ('RESUME','ROLLBACK','ESCALATE','MITIGATE_AND_VERIFY')),
  status TEXT NOT NULL CHECK (status IN ('RECOVERED','ROLLED_BACK','ESCALATED','BLOCKED')),
  recovery_verified BOOLEAN NOT NULL,
  evidence_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trust_v144_global_controls (
  control_id TEXT PRIMARY KEY,
  global_kill_switch BOOLEAN NOT NULL DEFAULT FALSE,
  service_freeze JSONB NOT NULL DEFAULT '[]'::jsonb,
  tenant_isolation JSONB NOT NULL DEFAULT '[]'::jsonb,
  rollout_freeze JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO trust_v144_global_controls(control_id) VALUES('default') ON CONFLICT(control_id) DO NOTHING;
