-- TRUST V234 — Returns, inspection, refund settlement and customer resolution.
CREATE TABLE IF NOT EXISTS trust_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  status text NOT NULL CHECK(status IN ('REQUESTED','APPROVED','REJECTED','RECEIVED','INSPECTING','APPROVED_REFUND','REFUND_PENDING','REFUNDED','CLOSED')) DEFAULT 'REQUESTED',
  reason_code text NOT NULL CHECK(reason_code IN ('WRONG_ITEM','DAMAGED','DEFECTIVE','NOT_AS_DESCRIBED','SIZE_OR_FIT','CHANGED_MIND','LATE_DELIVERY','OTHER')),
  reason_note text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  received_at timestamptz,
  inspected_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_returns_order ON trust_returns(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_returns_customer ON trust_returns(customer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_returns_status ON trust_returns(status,updated_at ASC);

CREATE TABLE IF NOT EXISTS trust_return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES trust_returns(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES trust_order_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK(quantity > 0),
  condition text NOT NULL CHECK(condition IN ('UNKNOWN','SEALED','OPENED','USED','DAMAGED','DEFECTIVE')) DEFAULT 'UNKNOWN',
  inspection_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(return_id,order_item_id)
);
CREATE INDEX IF NOT EXISTS idx_trust_return_items_return ON trust_return_items(return_id);

CREATE TABLE IF NOT EXISTS trust_return_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES trust_returns(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  source text NOT NULL,
  actor_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_return_events_return ON trust_return_events(return_id,created_at ASC);

CREATE TABLE IF NOT EXISTS trust_return_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES trust_returns(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK(decision IN ('PENDING','ACCEPT','PARTIAL','REJECT')) DEFAULT 'PENDING',
  condition text NOT NULL CHECK(condition IN ('UNKNOWN','SEALED','OPENED','USED','DAMAGED','DEFECTIVE')) DEFAULT 'UNKNOWN',
  recoverable boolean,
  restockable boolean,
  note text,
  inspector_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_return_inspections_return ON trust_return_inspections(return_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_refund_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id uuid NOT NULL REFERENCES trust_refunds(id) ON DELETE CASCADE,
  return_id uuid REFERENCES trust_returns(id) ON DELETE SET NULL,
  gross_amount numeric(12,2) NOT NULL CHECK(gross_amount > 0),
  restocking_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK(restocking_fee >= 0),
  shipping_adjustment numeric(12,2) NOT NULL DEFAULT 0,
  net_amount numeric(12,2) NOT NULL CHECK(net_amount > 0),
  currency text NOT NULL DEFAULT 'EGP',
  status text NOT NULL CHECK(status IN ('CALCULATED','REQUESTED','SETTLED','FAILED','REVERSED')) DEFAULT 'CALCULATED',
  calculation_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_trust_refund_settlements_refund ON trust_refund_settlements(refund_id);
CREATE INDEX IF NOT EXISTS idx_trust_refund_settlements_return ON trust_refund_settlements(return_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_return_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES trust_returns(id) ON DELETE CASCADE,
  outcome text NOT NULL CHECK(outcome IN ('REFUND','REPLACEMENT','STORE_CREDIT','REJECTED','NO_ACTION')),
  amount numeric(12,2),
  currency text DEFAULT 'EGP',
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_return_outcomes_return ON trust_return_outcomes(return_id,created_at DESC);

ALTER TABLE trust_refunds ADD COLUMN IF NOT EXISTS return_id uuid REFERENCES trust_returns(id) ON DELETE SET NULL;
ALTER TABLE trust_refunds ADD COLUMN IF NOT EXISTS settlement_id uuid;
CREATE INDEX IF NOT EXISTS idx_trust_refunds_return ON trust_refunds(return_id,created_at DESC) WHERE return_id IS NOT NULL;
