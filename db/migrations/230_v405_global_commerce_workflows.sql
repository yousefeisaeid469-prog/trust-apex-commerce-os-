-- V405 — Global Commerce Event + Workflow Orchestration.
-- Durable workflow instances/steps and compensation state. Workflows execute through
-- the V404 command bus and existing domain transaction engines; this migration does
-- not introduce a second commerce authority.
CREATE TABLE IF NOT EXISTS trust_workflow_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  workflow_type text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  status text NOT NULL DEFAULT 'RUNNING'
    CHECK(status IN ('RUNNING','SUCCEEDED','COMPENSATING','COMPENSATED','FAILED','DEAD','CANCELLED')),
  current_step integer NOT NULL DEFAULT 0 CHECK(current_step >= 0),
  correlation_id text,
  causation_id text,
  input_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_json jsonb,
  failure_code text,
  failure_message text,
  locked_at timestamptz,
  locked_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS trust_workflow_ready_idx
  ON trust_workflow_instances(status, updated_at, created_at);
CREATE INDEX IF NOT EXISTS trust_workflow_aggregate_idx
  ON trust_workflow_instances(tenant_id, aggregate_type, aggregate_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES trust_workflow_instances(id) ON DELETE CASCADE,
  step_index integer NOT NULL CHECK(step_index >= 0),
  step_key text NOT NULL,
  command_type text NOT NULL,
  command_payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  compensation_command_type text,
  compensation_payload_json jsonb,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','RUNNING','SUCCEEDED','COMPENSATING','COMPENSATED','FAILED','SKIPPED')),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  command_id uuid,
  result_json jsonb,
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, step_index),
  UNIQUE(workflow_id, step_key)
);
CREATE INDEX IF NOT EXISTS trust_workflow_steps_ready_idx
  ON trust_workflow_steps(status, available_at, created_at);
CREATE INDEX IF NOT EXISTS trust_workflow_steps_workflow_idx
  ON trust_workflow_steps(workflow_id, step_index);

CREATE TABLE IF NOT EXISTS trust_workflow_events (
  id bigserial PRIMARY KEY,
  workflow_id uuid NOT NULL REFERENCES trust_workflow_instances(id) ON DELETE CASCADE,
  step_id uuid REFERENCES trust_workflow_steps(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_workflow_events_workflow_idx
  ON trust_workflow_events(workflow_id, created_at, id);

COMMENT ON TABLE trust_workflow_instances IS
  'V405 durable commerce workflow/saga state machine. Domain truth remains in existing commerce tables.';
COMMENT ON TABLE trust_workflow_steps IS
  'V405 durable ordered workflow steps with explicit compensation commands.';
COMMENT ON TABLE trust_workflow_events IS
  'V405 immutable workflow transition journal.';
