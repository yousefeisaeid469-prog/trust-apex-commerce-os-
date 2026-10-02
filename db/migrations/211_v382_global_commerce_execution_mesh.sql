-- V382 — durable command execution mesh: leases, attempts, retries, dead letters and receipts.
CREATE TABLE IF NOT EXISTS trust_commerce_execution_mesh_jobs (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID NOT NULL UNIQUE,
  command_id UUID NOT NULL UNIQUE REFERENCES trust_commerce_decision_commands(command_id),
  state TEXT NOT NULL CHECK (state IN ('PENDING','PROCESSING','RETRYING','EXECUTED','FAILED','DEAD_LETTERED')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
  lease_until TIMESTAMPTZ,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS trust_commerce_execution_mesh_attempts (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES trust_commerce_execution_mesh_jobs(job_id),
  attempt_no INTEGER NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('STARTED','SUCCEEDED','FAILED','ABANDONED')),
  worker_id TEXT NOT NULL,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(job_id, attempt_no)
);

CREATE TABLE IF NOT EXISTS trust_commerce_execution_mesh_receipts (
  id BIGSERIAL PRIMARY KEY,
  receipt_id UUID NOT NULL UNIQUE,
  job_id UUID NOT NULL REFERENCES trust_commerce_execution_mesh_jobs(job_id),
  command_id UUID NOT NULL REFERENCES trust_commerce_decision_commands(command_id),
  status TEXT NOT NULL CHECK (status IN ('EXECUTED','FAILED','DEAD_LETTERED')),
  action TEXT NOT NULL,
  attempt_no INTEGER NOT NULL,
  provider_result JSONB,
  verification JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_execution_mesh_jobs_ready ON trust_commerce_execution_mesh_jobs(state, available_at);
CREATE INDEX IF NOT EXISTS idx_execution_mesh_jobs_lease ON trust_commerce_execution_mesh_jobs(state, lease_until);
CREATE INDEX IF NOT EXISTS idx_execution_mesh_attempts_job ON trust_commerce_execution_mesh_attempts(job_id, attempt_no DESC);
CREATE INDEX IF NOT EXISTS idx_execution_mesh_receipts_command ON trust_commerce_execution_mesh_receipts(command_id, created_at DESC);

COMMENT ON TABLE trust_commerce_execution_mesh_jobs IS 'V382 durable command execution queue. The mesh owns delivery mechanics, not business-domain authority.';
COMMENT ON TABLE trust_commerce_execution_mesh_receipts IS 'V382 immutable-ish execution evidence linking command execution to provider result and verification.';
