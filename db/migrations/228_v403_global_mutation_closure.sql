-- V403 — Global mutation closure and command observability.
-- Additive only: V402 remains the inventory mutation authority.
CREATE TABLE IF NOT EXISTS trust_command_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  command_type text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  status text NOT NULL CHECK(status IN ('SUCCEEDED')),
  actor_id text,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS trust_command_receipts_idempotency_uq
  ON trust_command_receipts(command_type,idempotency_key);
CREATE INDEX IF NOT EXISTS trust_command_receipts_aggregate_idx
  ON trust_command_receipts(aggregate_type,aggregate_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_command_receipts_created_idx
  ON trust_command_receipts(created_at DESC);
COMMENT ON TABLE trust_command_receipts IS
  'V403 immutable receipt of successful/failed domain commands committed by the commerce mutation boundary.';

CREATE INDEX IF NOT EXISTS idx_trust_inventory_transactions_type_created
  ON trust_inventory_transactions(transaction_type,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_inventory_transactions_idempotency_created
  ON trust_inventory_transactions(idempotency_key,created_at DESC);

COMMENT ON TABLE trust_inventory_transactions IS
  'V403 canonical immutable inventory mutation journal; V402 introduced the boundary and V403 closes legacy mutation paths.';
