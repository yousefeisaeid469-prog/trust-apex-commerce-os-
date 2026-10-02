-- TRUST V419 — Global Commerce State Machine + Event/Command Reconciliation
-- This is a projection/reconciliation layer. It never becomes the source of commerce truth.

CREATE TABLE IF NOT EXISTS trust_commerce_state_reconciliation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL UNIQUE,
  state_version text NOT NULL,
  observed_state text NOT NULL CHECK (observed_state IN (
    'CHECKOUT_COMMITTED','PAYMENT_PENDING','PAYMENT_CAPTURED','EXECUTION','FULFILLMENT',
    'DELIVERY','SETTLEMENT','COMPLETED','BLOCKED','REFUNDED','UNKNOWN'
  )),
  expected_next_state text,
  reconciliation_status text NOT NULL CHECK (reconciliation_status IN ('ALIGNED','DRIFT','BLOCKED','UNKNOWN')),
  divergence_codes_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  authority_snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  observed_hash text NOT NULL,
  last_event_id text,
  last_command_id text,
  recommended_action text,
  last_reconciled_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_state_recon_status
  ON trust_commerce_state_reconciliation(reconciliation_status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_state_recon_order
  ON trust_commerce_state_reconciliation(order_id);

CREATE TABLE IF NOT EXISTS trust_commerce_state_reconciliation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  reconciliation_id uuid REFERENCES trust_commerce_state_reconciliation(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_key text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id,event_type,event_key)
);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_state_recon_events_order
  ON trust_commerce_state_reconciliation_events(order_id,created_at DESC);
