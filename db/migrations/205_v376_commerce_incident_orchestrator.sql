-- V376 — durable incident snapshots for cross-domain operational correlation.
CREATE TABLE IF NOT EXISTS trust_commerce_incident_snapshots (
  id BIGSERIAL PRIMARY KEY,
  snapshot_key TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL,
  incident_count INTEGER NOT NULL,
  payload JSONB NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_incident_snapshots_captured ON trust_commerce_incident_snapshots(captured_at DESC);
COMMENT ON TABLE trust_commerce_incident_snapshots IS 'V376 operational incident read model; never authoritative for orders, money, inventory, fulfillment or revenue.';
