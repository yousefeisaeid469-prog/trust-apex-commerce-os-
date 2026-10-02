-- V375 — Global Commerce Control Plane durable operational state.
CREATE TABLE IF NOT EXISTS trust_global_commerce_control_snapshots (
  id BIGSERIAL PRIMARY KEY,
  snapshot_key TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL,
  health_state TEXT NOT NULL,
  payload JSONB NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_global_commerce_control_snapshots_captured ON trust_global_commerce_control_snapshots(captured_at DESC);

CREATE TABLE IF NOT EXISTS trust_global_commerce_control_commands (
  id BIGSERIAL PRIMARY KEY,
  command_id TEXT NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  actor_email TEXT,
  target_order_id TEXT,
  status TEXT NOT NULL,
  risk TEXT NOT NULL,
  reason TEXT,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_trust_global_commerce_control_commands_created ON trust_global_commerce_control_commands(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_global_commerce_control_commands_order ON trust_global_commerce_control_commands(target_order_id,created_at DESC);

COMMENT ON TABLE trust_global_commerce_control_snapshots IS 'V375 read-model projection; never authoritative for business state.';
COMMENT ON TABLE trust_global_commerce_control_commands IS 'V375 durable command evidence; command execution delegates to existing bounded authorities.';
