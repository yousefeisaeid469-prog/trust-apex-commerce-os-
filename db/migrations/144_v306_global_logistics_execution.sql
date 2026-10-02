-- TRUST V306 — Global Logistics Execution
-- Bridges V305 logistics decisions into durable shipment execution jobs.
CREATE TABLE IF NOT EXISTS trust_global_logistics_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL REFERENCES trust_global_logistics_decisions(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
  shipment_id uuid NOT NULL REFERENCES trust_shipments(id) ON DELETE RESTRICT,
  carrier_code text NOT NULL REFERENCES trust_global_carrier_registry(carrier_code) ON DELETE RESTRICT,
  service_code text NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED' CHECK(status IN ('QUEUED','PROCESSING','LABEL_CREATED','FAILED','CANCELLED')),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  provider_reference text,
  tracking_number text,
  last_error text,
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key text NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_global_logistics_exec_ready ON trust_global_logistics_executions(status,available_at,lease_until);
CREATE INDEX IF NOT EXISTS idx_global_logistics_exec_shipment ON trust_global_logistics_executions(shipment_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_logistics_exec_order ON trust_global_logistics_executions(order_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_global_logistics_execution_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES trust_global_logistics_executions(id) ON DELETE CASCADE,
  attempt_no integer NOT NULL CHECK(attempt_no > 0),
  outcome text NOT NULL CHECK(outcome IN ('STARTED','LABEL_CREATED','FAILED','SKIPPED')),
  provider_reference text,
  tracking_number text,
  error_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(execution_id,attempt_no)
);
CREATE INDEX IF NOT EXISTS idx_global_logistics_attempts_execution ON trust_global_logistics_execution_attempts(execution_id,attempt_no DESC);
