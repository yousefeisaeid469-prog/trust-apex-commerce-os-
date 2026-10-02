-- V407 — Global Runtime Spine.
-- One durable operation identity spans commands and workflows without replacing
-- domain truth. Runtime operations are execution telemetry/control truth only.
CREATE TABLE IF NOT EXISTS trust_runtime_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  operation_type text NOT NULL,
  operation_key text NOT NULL,
  aggregate_type text,
  aggregate_id text,
  command_id uuid REFERENCES trust_commands(id) ON DELETE SET NULL,
  workflow_id uuid REFERENCES trust_workflow_instances(id) ON DELETE SET NULL,
  correlation_id text,
  causation_id text,
  status text NOT NULL DEFAULT 'ACCEPTED'
    CHECK(status IN ('ACCEPTED','RUNNING','WAITING','SUCCEEDED','FAILED','DEAD','CANCELLED')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count >= 0),
  last_error_code text,
  last_error_message text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,operation_type,operation_key)
);
CREATE INDEX IF NOT EXISTS trust_runtime_operations_status_idx
  ON trust_runtime_operations(status,updated_at,created_at);
CREATE INDEX IF NOT EXISTS trust_runtime_operations_aggregate_idx
  ON trust_runtime_operations(tenant_id,aggregate_type,aggregate_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_runtime_operations_command_idx
  ON trust_runtime_operations(command_id) WHERE command_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS trust_runtime_operations_workflow_idx
  ON trust_runtime_operations(workflow_id) WHERE workflow_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS trust_runtime_operation_events (
  id bigserial PRIMARY KEY,
  operation_id uuid NOT NULL REFERENCES trust_runtime_operations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  attempt integer,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_runtime_operation_events_operation_idx
  ON trust_runtime_operation_events(operation_id,created_at,id);

CREATE OR REPLACE VIEW trust_runtime_operation_snapshot AS
SELECT o.id,o.tenant_id AS "tenantId",o.operation_type AS "operationType",o.operation_key AS "operationKey",
       o.aggregate_type AS "aggregateType",o.aggregate_id AS "aggregateId",o.command_id AS "commandId",
       o.workflow_id AS "workflowId",o.correlation_id AS "correlationId",o.causation_id AS "causationId",
       o.status,o.attempt_count AS "attemptCount",o.last_error_code AS "lastErrorCode",
       o.last_error_message AS "lastErrorMessage",o.metadata_json AS metadata,o.started_at AS "startedAt",
       o.finished_at AS "finishedAt",o.created_at AS "createdAt",o.updated_at AS "updatedAt",
       COALESCE(e.event_count,0)::int AS "eventCount"
FROM trust_runtime_operations o
LEFT JOIN LATERAL (
  SELECT count(*) AS event_count FROM trust_runtime_operation_events x WHERE x.operation_id=o.id
) e ON true;

COMMENT ON TABLE trust_runtime_operations IS
  'V407 unified execution identity for durable commands and workflows; domain tables remain authoritative.';
COMMENT ON TABLE trust_runtime_operation_events IS
  'V407 immutable runtime execution stage journal.';
