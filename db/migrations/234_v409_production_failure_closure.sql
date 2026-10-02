-- V409 — Production Failure Closure & Recovery.
-- Makes execution failures durable, classified and recoverable without creating a second source of commerce truth.
CREATE TABLE IF NOT EXISTS trust_commerce_recovery_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  execution_run_id uuid REFERENCES trust_commerce_execution_runs(id) ON DELETE SET NULL,
  runtime_operation_id uuid REFERENCES trust_runtime_operations(id) ON DELETE SET NULL,
  job_id uuid REFERENCES trust_commerce_execution_jobs(id) ON DELETE SET NULL,
  boundary text NOT NULL CHECK (boundary IN ('PAYMENT','INVENTORY','FULFILLMENT','DELIVERY','SETTLEMENT','RUNTIME','UNKNOWN')),
  failure_code text NOT NULL,
  severity text NOT NULL DEFAULT 'RECOVERABLE' CHECK (severity IN ('RECOVERABLE','BLOCKED','ESCALATED')),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLAIMED','RESOLVED','ESCALATED','CANCELLED')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  last_error_message text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS trust_commerce_recovery_open_order_idx
  ON trust_commerce_recovery_cases(order_id)
  WHERE status IN ('OPEN','CLAIMED','ESCALATED');
CREATE INDEX IF NOT EXISTS trust_commerce_recovery_status_idx
  ON trust_commerce_recovery_cases(status,severity,last_seen_at DESC);
CREATE INDEX IF NOT EXISTS trust_commerce_recovery_boundary_idx
  ON trust_commerce_recovery_cases(boundary,status,updated_at DESC);

CREATE TABLE IF NOT EXISTS trust_commerce_recovery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recovery_case_id uuid NOT NULL REFERENCES trust_commerce_recovery_cases(id) ON DELETE CASCADE,
  job_id uuid REFERENCES trust_commerce_execution_jobs(id) ON DELETE SET NULL,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  action text NOT NULL CHECK (action IN ('DETECT','RETRY','RESUME','ESCALATE','RESOLVE','CANCEL')),
  outcome text NOT NULL CHECK (outcome IN ('OPENED','RETRYING','SUCCEEDED','FAILED','ESCALATED','CANCELLED')),
  error_code text,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(recovery_case_id,attempt_number)
);

CREATE INDEX IF NOT EXISTS trust_commerce_recovery_attempts_case_idx
  ON trust_commerce_recovery_attempts(recovery_case_id,created_at DESC);

CREATE OR REPLACE VIEW trust_commerce_recovery_snapshot AS
SELECT
  c.id AS recovery_case_id,
  c.order_id,
  c.execution_run_id,
  c.runtime_operation_id,
  c.job_id,
  c.boundary,
  c.failure_code,
  c.severity,
  c.status,
  c.attempt_count,
  c.first_seen_at,
  c.last_seen_at,
  c.resolved_at,
  c.last_error_message,
  c.metadata_json,
  coalesce(a.attempt_total,0) AS recovery_attempt_total,
  a.last_action,
  a.last_outcome,
  a.last_attempt_at
FROM trust_commerce_recovery_cases c
LEFT JOIN LATERAL (
  SELECT count(*)::int AS attempt_total,
         (array_agg(action ORDER BY created_at DESC,id DESC))[1] AS last_action,
         (array_agg(outcome ORDER BY created_at DESC,id DESC))[1] AS last_outcome,
         max(created_at) AS last_attempt_at
  FROM trust_commerce_recovery_attempts ra
  WHERE ra.recovery_case_id=c.id
) a ON true;

COMMENT ON TABLE trust_commerce_recovery_cases IS
  'V409 durable failure boundary and recovery state; domain tables remain authoritative for commerce truth.';
COMMENT ON VIEW trust_commerce_recovery_snapshot IS
  'V409 operator/recovery view of unresolved and resolved production execution failures.';
