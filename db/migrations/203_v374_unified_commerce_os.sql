-- V374 — Unified Commerce OS operational snapshot.
CREATE TABLE IF NOT EXISTS trust_commerce_os_snapshots (
  id BIGSERIAL PRIMARY KEY,
  snapshot_key TEXT NOT NULL,
  version TEXT NOT NULL,
  health_state TEXT NOT NULL,
  payload JSONB NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(snapshot_key)
);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_os_snapshots_captured_at ON trust_commerce_os_snapshots(captured_at DESC);
COMMENT ON TABLE trust_commerce_os_snapshots IS 'V374 durable operational projections; never authoritative for orders, money, inventory, fulfillment or revenue.';
