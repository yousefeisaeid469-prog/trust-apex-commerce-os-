-- V391 Production Commerce Hardening.
-- Operational invariants for the real commerce execution path. No audit-only state.

CREATE TABLE IF NOT EXISTS trust_commerce_lifecycle_contract (
  from_status text NOT NULL,
  to_status text NOT NULL,
  contract_version text NOT NULL DEFAULT 'V391.0.0',
  PRIMARY KEY (from_status, to_status),
  CHECK (from_status IN ('CAPTURED','FULFILLMENT_PLANNED','IN_FULFILLMENT','DELIVERED','SETTLEMENT_RELEASED','COMPLETED','BLOCKED','REFUNDED')),
  CHECK (to_status IN ('CAPTURED','FULFILLMENT_PLANNED','IN_FULFILLMENT','DELIVERED','SETTLEMENT_RELEASED','COMPLETED','BLOCKED','REFUNDED'))
);

INSERT INTO trust_commerce_lifecycle_contract(from_status,to_status) VALUES
('CAPTURED','FULFILLMENT_PLANNED'),('CAPTURED','BLOCKED'),('CAPTURED','REFUNDED'),
('FULFILLMENT_PLANNED','IN_FULFILLMENT'),('FULFILLMENT_PLANNED','DELIVERED'),('FULFILLMENT_PLANNED','BLOCKED'),('FULFILLMENT_PLANNED','REFUNDED'),
('IN_FULFILLMENT','DELIVERED'),('IN_FULFILLMENT','BLOCKED'),('IN_FULFILLMENT','REFUNDED'),
('DELIVERED','SETTLEMENT_RELEASED'),('DELIVERED','COMPLETED'),('DELIVERED','REFUNDED'),
('SETTLEMENT_RELEASED','COMPLETED'),('SETTLEMENT_RELEASED','REFUNDED'),
('COMPLETED','REFUNDED'),
('BLOCKED','FULFILLMENT_PLANNED'),('BLOCKED','IN_FULFILLMENT'),('BLOCKED','REFUNDED')
ON CONFLICT DO NOTHING;

ALTER TABLE trust_commerce_execution_runs
  ADD CONSTRAINT trust_commerce_execution_runs_delivery_count_ck
  CHECK (delivered_fulfillment_order_count <= fulfillment_order_count) NOT VALID;

ALTER TABLE trust_commerce_execution_jobs
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz;

CREATE INDEX IF NOT EXISTS trust_commerce_execution_jobs_recovery_idx
  ON trust_commerce_execution_jobs(status, lease_until, available_at)
  WHERE status IN ('PROCESSING','WAITING','PENDING');

ALTER TABLE trust_outbox_events
  ADD COLUMN IF NOT EXISTS dedupe_key text;

CREATE UNIQUE INDEX IF NOT EXISTS trust_outbox_events_dedupe_key_uq
  ON trust_outbox_events(dedupe_key)
  WHERE dedupe_key IS NOT NULL;

COMMENT ON TABLE trust_commerce_lifecycle_contract IS
  'V391 canonical commerce execution transition contract shared by runtime and database validation.';
