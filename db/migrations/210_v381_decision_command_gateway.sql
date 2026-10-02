-- V381 — durable execution gateway for ALLOW decisions.
CREATE TABLE IF NOT EXISTS trust_commerce_decision_commands (
  id BIGSERIAL PRIMARY KEY,
  command_id UUID NOT NULL UNIQUE,
  decision_id UUID NOT NULL REFERENCES trust_commerce_decision_requests(decision_id),
  idempotency_key TEXT NOT NULL UNIQUE,
  action TEXT NOT NULL CHECK (action IN ('RECOVER_ORDER_LEASES')),
  target_order_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('CREATED','APPROVED','EXECUTING','EXECUTED','FAILED','REJECTED')),
  requested_by TEXT NOT NULL,
  request_reason TEXT NOT NULL,
  approved_by TEXT,
  approval_reason TEXT,
  approved_at TIMESTAMPTZ,
  executed_by TEXT,
  execution_reason TEXT,
  execution_request_id TEXT,
  executing_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  precondition JSONB NOT NULL,
  result JSONB,
  verification JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_commerce_decision_command_approvals (
  id BIGSERIAL PRIMARY KEY,
  command_id UUID NOT NULL REFERENCES trust_commerce_decision_commands(command_id),
  actor_email TEXT NOT NULL,
  reason TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('APPROVED','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decision_commands_state_time ON trust_commerce_decision_commands(state,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_commands_decision ON trust_commerce_decision_commands(decision_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_commands_target ON trust_commerce_decision_commands(target_order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_command_approvals_command ON trust_commerce_decision_command_approvals(command_id,created_at DESC);

COMMENT ON TABLE trust_commerce_decision_commands IS 'V381 execution gateway: commands are durable, owner-approved, idempotent, revalidated, and delegated to existing domain authorities.';
COMMENT ON COLUMN trust_commerce_decision_commands.precondition IS 'Snapshot of the decision policy revision and incident identity required before execution.';
COMMENT ON COLUMN trust_commerce_decision_commands.verification IS 'Post-execution verification evidence; directBusinessMutation remains false.';
