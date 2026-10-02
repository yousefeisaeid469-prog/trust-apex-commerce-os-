-- TRUST V235 — Reverse Commerce Execution
-- Durable inventory recovery, replacement orders, store credit and financial ledger.
CREATE TABLE IF NOT EXISTS trust_inventory_recovery_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES trust_returns(id) ON DELETE CASCADE,
  return_item_id uuid REFERENCES trust_return_items(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES trust_products(id),
  disposition text NOT NULL CHECK(disposition IN ('RESTOCK','QUARANTINE','DISPOSE','RETURN_TO_VENDOR','REPLACE')),
  quantity integer NOT NULL CHECK(quantity > 0),
  delta integer NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPLIED','REVERSED','FAILED')),
  warehouse_location text,
  reason text NOT NULL,
  idempotency_key text NOT NULL,
  applied_at timestamptz,
  reversed_at timestamptz,
  failure_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_inventory_recovery_return ON trust_inventory_recovery_actions(return_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_recovery_product ON trust_inventory_recovery_actions(product_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_replacement_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES trust_returns(id) ON DELETE RESTRICT,
  original_order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'REQUESTED' CHECK(status IN ('REQUESTED','APPROVED','RESERVED','CONFIRMED','FULFILLING','SHIPPED','DELIVERED','CANCELLED','FAILED')),
  currency text NOT NULL DEFAULT 'EGP',
  merchandise_total numeric(12,2) NOT NULL DEFAULT 0 CHECK(merchandise_total >= 0),
  shipping_total numeric(12,2) NOT NULL DEFAULT 0 CHECK(shipping_total >= 0),
  customer_charge numeric(12,2) NOT NULL DEFAULT 0 CHECK(customer_charge >= 0),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_replacement_orders_return ON trust_replacement_orders(return_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replacement_orders_customer ON trust_replacement_orders(customer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replacement_orders_status ON trust_replacement_orders(status,updated_at ASC);

CREATE TABLE IF NOT EXISTS trust_replacement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  replacement_order_id uuid NOT NULL REFERENCES trust_replacement_orders(id) ON DELETE CASCADE,
  source_return_item_id uuid REFERENCES trust_return_items(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES trust_products(id),
  quantity integer NOT NULL CHECK(quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK(unit_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(replacement_order_id,product_id)
);
CREATE INDEX IF NOT EXISTS idx_replacement_items_order ON trust_replacement_items(replacement_order_id);

CREATE TABLE IF NOT EXISTS trust_replacement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  replacement_order_id uuid NOT NULL REFERENCES trust_replacement_orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  source text NOT NULL,
  actor_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_replacement_events_order ON trust_replacement_events(replacement_order_id,created_at ASC);

CREATE TABLE IF NOT EXISTS trust_store_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE RESTRICT,
  return_id uuid REFERENCES trust_returns(id) ON DELETE SET NULL,
  code text NOT NULL UNIQUE,
  currency text NOT NULL DEFAULT 'EGP',
  original_amount numeric(12,2) NOT NULL CHECK(original_amount > 0),
  remaining_amount numeric(12,2) NOT NULL CHECK(remaining_amount >= 0),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','EXHAUSTED','EXPIRED','CANCELLED')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(remaining_amount <= original_amount)
);
CREATE INDEX IF NOT EXISTS idx_store_credits_customer ON trust_store_credits(customer_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_credits_code ON trust_store_credits(code);

CREATE TABLE IF NOT EXISTS trust_store_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id uuid NOT NULL REFERENCES trust_store_credits(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK(kind IN ('ISSUE','REDEEM','REVERSE','EXPIRE','CANCEL')),
  amount numeric(12,2) NOT NULL CHECK(amount > 0),
  balance_after numeric(12,2) NOT NULL CHECK(balance_after >= 0),
  reference_type text,
  reference_id text,
  idempotency_key text NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_store_credit_transactions_credit ON trust_store_credit_transactions(credit_id,created_at ASC);
CREATE INDEX IF NOT EXISTS idx_store_credit_transactions_customer ON trust_store_credit_transactions(customer_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_financial_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  return_id uuid REFERENCES trust_returns(id) ON DELETE SET NULL,
  replacement_order_id uuid REFERENCES trust_replacement_orders(id) ON DELETE SET NULL,
  store_credit_id uuid REFERENCES trust_store_credits(id) ON DELETE SET NULL,
  entry_type text NOT NULL CHECK(entry_type IN ('REFUND','STORE_CREDIT_ISSUE','STORE_CREDIT_REDEEM','STORE_CREDIT_REVERSE','REPLACEMENT_CHARGE','REPLACEMENT_WAIVER','INVENTORY_RECOVERY')),
  direction text NOT NULL CHECK(direction IN ('DEBIT','CREDIT')),
  amount numeric(12,2) NOT NULL CHECK(amount > 0),
  currency text NOT NULL DEFAULT 'EGP',
  status text NOT NULL DEFAULT 'POSTED' CHECK(status IN ('PENDING','POSTED','REVERSED')),
  reference_key text NOT NULL UNIQUE,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_customer ON trust_financial_ledger_entries(customer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_return ON trust_financial_ledger_entries(return_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_status ON trust_financial_ledger_entries(status,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_reverse_commerce_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL CHECK(job_type IN ('INVENTORY_RECOVERY','REPLACEMENT_RESERVATION','STORE_CREDIT_RECONCILIATION','LEDGER_RECONCILIATION')),
  aggregate_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','PROCESSING','DONE','FAILED','DEAD')),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reverse_jobs_ready ON trust_reverse_commerce_jobs(status,available_at,lease_until);
CREATE INDEX IF NOT EXISTS idx_reverse_jobs_aggregate ON trust_reverse_commerce_jobs(aggregate_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_customer_compensations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
  return_id uuid REFERENCES trust_returns(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL CHECK(amount > 0),
  currency text NOT NULL DEFAULT 'EGP',
  reason text NOT NULL CHECK(reason IN ('SERVICE_FAILURE','DAMAGED_IN_TRANSIT','LATE_DELIVERY','WRONG_ITEM','PARTIAL_FULFILLMENT','GOODWILL')),
  method text NOT NULL CHECK(method IN ('STORE_CREDIT','REFUND_ADJUSTMENT')),
  status text NOT NULL DEFAULT 'REQUESTED' CHECK(status IN ('REQUESTED','APPROVED','ISSUED','REVERSED','REJECTED')),
  note text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customer_compensations_customer ON trust_customer_compensations(customer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_compensations_order ON trust_customer_compensations(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_compensations_status ON trust_customer_compensations(status,updated_at ASC);
CREATE TABLE IF NOT EXISTS trust_compensation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compensation_id uuid NOT NULL REFERENCES trust_customer_compensations(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  source text NOT NULL,
  actor_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_compensation_events_compensation ON trust_compensation_events(compensation_id,created_at ASC);
