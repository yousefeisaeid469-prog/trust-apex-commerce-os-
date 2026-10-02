-- TRUST V309 — Global Logistics Recovery Orchestrator
-- Converts V308 control-tower findings into durable, idempotent recovery plans/actions.
CREATE TABLE IF NOT EXISTS trust_global_logistics_recovery_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
  shipment_id uuid NOT NULL REFERENCES trust_shipments(id) ON DELETE RESTRICT,
  control_tower_snapshot_id uuid REFERENCES trust_global_logistics_control_tower_snapshots(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'PLANNED' CHECK(status IN ('PLANNED','EXECUTING','SUCCEEDED','FAILED','CANCELLED')),
  risk_band text NOT NULL CHECK(risk_band IN ('GREEN','AMBER','RED')),
  risk_score integer NOT NULL CHECK(risk_score BETWEEN 0 AND 100),
  priority integer NOT NULL CHECK(priority BETWEEN 0 AND 100),
  reason_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_global_logistics_recovery_plans_order ON trust_global_logistics_recovery_plans(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_logistics_recovery_plans_ready ON trust_global_logistics_recovery_plans(status,priority DESC,created_at ASC);
CREATE INDEX IF NOT EXISTS idx_global_logistics_recovery_plans_shipment ON trust_global_logistics_recovery_plans(shipment_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_global_logistics_recovery_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES trust_global_logistics_recovery_plans(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
  shipment_id uuid NOT NULL REFERENCES trust_shipments(id) ON DELETE RESTRICT,
  action_type text NOT NULL CHECK(action_type IN ('NO_ACTION','REQUEST_CARRIER_REFRESH','RETRY_LOGISTICS_EXECUTION','REVIEW_CUSTOMER_PROMISE','ESCALATE_CRITICAL_EXCEPTION')),
  status text NOT NULL DEFAULT 'QUEUED' CHECK(status IN ('QUEUED','PROCESSING','SUCCEEDED','FAILED','SKIPPED','CANCELLED')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count >= 0),
  max_attempts integer NOT NULL DEFAULT 3 CHECK(max_attempts > 0),
  idempotency_key text NOT NULL UNIQUE,
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  last_error text,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_global_logistics_recovery_actions_ready ON trust_global_logistics_recovery_actions(status,available_at,lease_until);
CREATE INDEX IF NOT EXISTS idx_global_logistics_recovery_actions_plan ON trust_global_logistics_recovery_actions(plan_id,created_at);
CREATE INDEX IF NOT EXISTS idx_global_logistics_recovery_actions_shipment ON trust_global_logistics_recovery_actions(shipment_id,created_at DESC);
