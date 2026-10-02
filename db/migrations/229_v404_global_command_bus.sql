-- V404 — Global Commerce Command Bus.
-- Durable command inbox + attempt journal. Commands are accepted once and
-- executed by a lease-based worker; handlers still use the existing domain
-- transaction boundaries (V403/V402) rather than bypassing them.
CREATE TABLE IF NOT EXISTS trust_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  command_type text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id text,
  correlation_id text,
  causation_id text,
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','PROCESSING','SUCCEEDED','RETRYING','DEAD','CANCELLED')),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  result_json jsonb,
  last_error text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS trust_commands_idempotency_uq
  ON trust_commands(tenant_id,command_type,idempotency_key);
CREATE INDEX IF NOT EXISTS trust_commands_ready_idx
  ON trust_commands(status,available_at,created_at);
CREATE INDEX IF NOT EXISTS trust_commands_aggregate_idx
  ON trust_commands(tenant_id,aggregate_type,aggregate_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_commands_processing_idx
  ON trust_commands(status,locked_at) WHERE status='PROCESSING';

CREATE TABLE IF NOT EXISTS trust_command_attempts (
  id bigserial PRIMARY KEY,
  command_id uuid NOT NULL REFERENCES trust_commands(id) ON DELETE CASCADE,
  attempt integer NOT NULL,
  worker_id text NOT NULL,
  status text NOT NULL CHECK(status IN ('STARTED','SUCCEEDED','RETRYING','DEAD','FAILED')),
  error_code text,
  result_json jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS trust_command_attempts_uq
  ON trust_command_attempts(command_id,attempt);
CREATE INDEX IF NOT EXISTS trust_command_attempts_command_idx
  ON trust_command_attempts(command_id,started_at DESC);

COMMENT ON TABLE trust_commands IS
  'V404 durable command inbox and execution state; one idempotent command identity per tenant/type/key.';
COMMENT ON TABLE trust_command_attempts IS
  'V404 immutable execution-attempt journal for command workers.';
