CREATE TABLE IF NOT EXISTS trust_recovery_drills (
  drill_id TEXT PRIMARY KEY,
  region TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_backup_evidence (
  backup_id TEXT PRIMARY KEY,
  region TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  restore_tested_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_recovery_drills_region_status ON trust_recovery_drills(region,status);
CREATE INDEX IF NOT EXISTS idx_trust_backup_evidence_region_status ON trust_backup_evidence(region,status);
