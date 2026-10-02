-- V356 — Distributed Commerce Workers & Recovery Engine.
-- Durable work queue for commerce execution. This is operational state, not audit evidence.
CREATE TABLE IF NOT EXISTS trust_commerce_execution_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  execution_run_id uuid NOT NULL REFERENCES trust_commerce_execution_runs(id) ON DELETE CASCADE,
  job_type text NOT NULL CHECK (job_type IN ('EXECUTE_ORDER','RECOVER_ORDER')),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','WAITING','SUCCEEDED','DEAD')),
  idempotency_key text NOT NULL UNIQUE,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  failure_count integer NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  lease_token text,
  last_error_code text,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trust_commerce_execution_jobs_claim_idx
  ON trust_commerce_execution_jobs(status, available_at, created_at, id)
  WHERE status IN ('PENDING','WAITING');
CREATE INDEX IF NOT EXISTS trust_commerce_execution_jobs_lease_idx
  ON trust_commerce_execution_jobs(status, lease_until)
  WHERE status='PROCESSING';
CREATE INDEX IF NOT EXISTS trust_commerce_execution_jobs_order_idx
  ON trust_commerce_execution_jobs(order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_commerce_execution_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES trust_commerce_execution_jobs(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  outcome text NOT NULL CHECK (outcome IN ('SUCCEEDED','WAITING','FAILED','DEAD')),
  error_code text,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS trust_commerce_execution_attempts_job_idx
  ON trust_commerce_execution_attempts(job_id, attempt_number DESC);

COMMENT ON TABLE trust_commerce_execution_jobs IS
  'V356: durable commerce execution work queue with leases, bounded recovery and poison-job isolation.';
COMMENT ON TABLE trust_commerce_execution_attempts IS
  'V356: durable per-attempt operational record for commerce execution workers.';
