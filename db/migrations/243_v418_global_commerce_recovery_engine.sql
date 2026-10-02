-- V418 — Global Commerce Recovery & Reconciliation Engine
-- Recovery is bounded and idempotent. Domain tables remain authoritative.
CREATE TABLE IF NOT EXISTS trust_commerce_recovery_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recovery_case_id uuid NOT NULL REFERENCES trust_commerce_recovery_cases(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  gap_code text NOT NULL,
  action text NOT NULL CHECK (action IN ('ENSURE_RUNTIME','RESUME_EXECUTION','RETRY_RECOVERY','NO_SAFE_AUTOFIX','RESOLVE')),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CLAIMED','SUCCEEDED','BLOCKED','FAILED','CANCELLED')),
  idempotency_key text NOT NULL UNIQUE,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  lease_token text,
  last_error_code text,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS trust_commerce_recovery_plans_ready_idx
  ON trust_commerce_recovery_plans(status,available_at,created_at);
CREATE INDEX IF NOT EXISTS trust_commerce_recovery_plans_case_idx
  ON trust_commerce_recovery_plans(recovery_case_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS trust_commerce_recovery_plans_order_idx
  ON trust_commerce_recovery_plans(order_id,status,updated_at DESC);

CREATE OR REPLACE VIEW trust_commerce_recovery_engine_snapshot AS
SELECT p.id AS plan_id,p.recovery_case_id,p.order_id,p.gap_code,p.action,p.status,
       p.idempotency_key,p.attempts,p.max_attempts,p.available_at,p.lease_until,
       p.last_error_code,p.result_json,p.created_at,p.updated_at,p.completed_at,
       c.boundary,c.failure_code,c.severity,c.status AS recovery_case_status
FROM trust_commerce_recovery_plans p
JOIN trust_commerce_recovery_cases c ON c.id=p.recovery_case_id;

COMMENT ON TABLE trust_commerce_recovery_plans IS
  'V418 bounded/idempotent repair plan. It never becomes a commerce truth authority.';
