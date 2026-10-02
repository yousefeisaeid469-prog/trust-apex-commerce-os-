-- V383 — Global Commerce Execution Fabric: durable workflows, adapter bindings,
-- compensation records and end-to-end execution receipts.
CREATE TABLE IF NOT EXISTS trust_commerce_execution_fabric_workflows (
  id BIGSERIAL PRIMARY KEY,
  workflow_id UUID NOT NULL UNIQUE,
  command_id UUID NOT NULL UNIQUE REFERENCES trust_commerce_decision_commands(command_id),
  tenant_id TEXT NOT NULL DEFAULT 'global',
  state TEXT NOT NULL CHECK (state IN ('READY','PROCESSING','SUCCEEDED','RETRYING','FAILED','COMPENSATING','COMPENSATED','DEAD_LETTERED')),
  current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step > 0),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
  lease_until TIMESTAMPTZ,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  correlation_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS trust_commerce_execution_fabric_steps (
  id BIGSERIAL PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES trust_commerce_execution_fabric_workflows(workflow_id),
  step_no INTEGER NOT NULL CHECK (step_no > 0),
  adapter_name TEXT NOT NULL,
  action TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('READY','PROCESSING','SUCCEEDED','RETRYING','FAILED','COMPENSATED')),
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  lease_until TIMESTAMPTZ,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, step_no)
);

CREATE TABLE IF NOT EXISTS trust_commerce_execution_fabric_adapters (
  id BIGSERIAL PRIMARY KEY,
  adapter_name TEXT NOT NULL UNIQUE,
  action TEXT NOT NULL,
  provider_kind TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('ACTIVE','DISABLED')) DEFAULT 'ACTIVE',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_commerce_execution_fabric_receipts (
  id BIGSERIAL PRIMARY KEY,
  receipt_id UUID NOT NULL UNIQUE,
  workflow_id UUID NOT NULL REFERENCES trust_commerce_execution_fabric_workflows(workflow_id),
  command_id UUID NOT NULL REFERENCES trust_commerce_decision_commands(command_id),
  step_no INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SUCCEEDED','FAILED','DEAD_LETTERED','COMPENSATED')),
  adapter_name TEXT NOT NULL,
  provider_result JSONB,
  verification JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_commerce_execution_fabric_compensations (
  id BIGSERIAL PRIMARY KEY,
  compensation_id UUID NOT NULL UNIQUE,
  workflow_id UUID NOT NULL REFERENCES trust_commerce_execution_fabric_workflows(workflow_id),
  step_no INTEGER NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('REQUESTED','EXECUTED','FAILED','NOT_REQUIRED')),
  reason TEXT NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

INSERT INTO trust_commerce_execution_fabric_adapters(adapter_name,action,provider_kind,config)
VALUES ('commerce.recovery.v382','RECOVER_ORDER_LEASES','INTERNAL_AUTHORITY','{"delegatesTo":"global-commerce-execution-mesh"}'::jsonb)
ON CONFLICT (adapter_name) DO UPDATE SET action=excluded.action,provider_kind=excluded.provider_kind,config=excluded.config,updated_at=now();

CREATE INDEX IF NOT EXISTS idx_execution_fabric_workflows_ready ON trust_commerce_execution_fabric_workflows(state,available_at);
CREATE INDEX IF NOT EXISTS idx_execution_fabric_workflows_lease ON trust_commerce_execution_fabric_workflows(state,lease_until);
CREATE INDEX IF NOT EXISTS idx_execution_fabric_steps_ready ON trust_commerce_execution_fabric_steps(state,available_at);
CREATE INDEX IF NOT EXISTS idx_execution_fabric_receipts_command ON trust_commerce_execution_fabric_receipts(command_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_fabric_compensations_workflow ON trust_commerce_execution_fabric_compensations(workflow_id,created_at DESC);

COMMENT ON TABLE trust_commerce_execution_fabric_workflows IS 'V383 durable orchestration boundary. It coordinates execution; business-domain authorities remain authoritative.';
COMMENT ON TABLE trust_commerce_execution_fabric_adapters IS 'V383 adapter registry. Provider kind identifies the authority boundary used by an execution step.';
COMMENT ON TABLE trust_commerce_execution_fabric_receipts IS 'V383 end-to-end execution evidence for workflow outcomes.';
