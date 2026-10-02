-- V406 — Global Order Journey Workflow Bridge.
-- Extends V405 with durable event waits/signals and connects the workflow runtime
-- to the existing payment-capture and shipment-delivery commerce authorities.
ALTER TABLE trust_workflow_steps DROP CONSTRAINT IF EXISTS trust_workflow_steps_status_check;
ALTER TABLE trust_workflow_steps ADD CONSTRAINT trust_workflow_steps_status_check
  CHECK(status IN ('PENDING','RUNNING','WAITING_EVENT','SUCCEEDED','COMPENSATING','COMPENSATED','FAILED','SKIPPED'));
ALTER TABLE trust_workflow_steps ADD COLUMN IF NOT EXISTS step_type text NOT NULL DEFAULT 'COMMAND';
ALTER TABLE trust_workflow_steps DROP CONSTRAINT IF EXISTS trust_workflow_steps_step_type_check;
ALTER TABLE trust_workflow_steps ADD CONSTRAINT trust_workflow_steps_step_type_check CHECK(step_type IN ('COMMAND','WAIT_FOR_EVENT'));
ALTER TABLE trust_workflow_steps ADD COLUMN IF NOT EXISTS wait_event_type text;
ALTER TABLE trust_workflow_steps ADD COLUMN IF NOT EXISTS wait_event_key text;
ALTER TABLE trust_workflow_steps ADD COLUMN IF NOT EXISTS event_payload_json jsonb;
CREATE INDEX IF NOT EXISTS trust_workflow_waiting_event_idx
  ON trust_workflow_steps(step_type,status,wait_event_type,wait_event_key);
CREATE TABLE IF NOT EXISTS trust_workflow_signals (
  id bigserial PRIMARY KEY, workflow_id uuid NOT NULL REFERENCES trust_workflow_instances(id) ON DELETE CASCADE,
  step_id uuid REFERENCES trust_workflow_steps(id) ON DELETE SET NULL, event_type text NOT NULL, event_key text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workflow_id,event_type,event_key)
);
CREATE INDEX IF NOT EXISTS trust_workflow_signals_lookup_idx ON trust_workflow_signals(event_type,event_key,created_at);
COMMENT ON TABLE trust_workflow_signals IS 'V406 durable external-event signals consumed by waiting workflow steps.';
