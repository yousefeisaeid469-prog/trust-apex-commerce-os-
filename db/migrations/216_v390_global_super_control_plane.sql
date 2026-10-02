-- V390 Global Super Control Plane
-- Durable owner command registry and snapshots. Business authorities remain in their owning domains.
CREATE TABLE IF NOT EXISTS trust_owner_control_commands (
  id BIGSERIAL PRIMARY KEY,
  command_id UUID NOT NULL UNIQUE,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  risk TEXT NOT NULL CHECK (risk IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status TEXT NOT NULL CHECK (status IN ('REQUESTED','ACCEPTED','REJECTED','FAILED')),
  reason TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  request_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_owner_control_commands_created ON trust_owner_control_commands(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_owner_control_commands_target ON trust_owner_control_commands(target,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_owner_control_snapshots (
  id BIGSERIAL PRIMARY KEY,
  snapshot_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_owner_control_snapshots_captured ON trust_owner_control_snapshots(captured_at DESC);
COMMENT ON TABLE trust_owner_control_commands IS 'V390 owner-only control-plane command evidence; never bypasses domain authorities.';
COMMENT ON TABLE trust_owner_control_snapshots IS 'V390 owner control room live read model; not authoritative for business state.';
