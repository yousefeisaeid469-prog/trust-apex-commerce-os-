-- V154 — the missing transactional core
-- A full source scan (every SQL table reference in modules/ and app/
-- cross-checked against every CREATE TABLE statement in db/migrations/)
-- found SIX tables that the checkout/payments code depends on directly
-- but that no migration ever created: trust_orders, trust_order_items,
-- trust_idempotency_keys, trust_inventory_reservations,
-- trust_inventory_ledger, trust_payment_events. Without this migration,
-- commitCheckout() and the entire payments orchestrator fail on first
-- real use against a real database.
--
-- Several later migrations (002, 020, 022, 023, 024) also referenced
-- these tables via ALTER TABLE / CREATE INDEX before they existed —
-- those premature statements have been neutralized in place (this was
-- pre-deployment; no live database ever ran this migration set) and
-- their intent is folded into the definitive schema below.

CREATE TABLE IF NOT EXISTS trust_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES trust_users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  discount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  shipping numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping >= 0),
  total numeric(12,2) NOT NULL CHECK (total >= 0),
  currency text NOT NULL DEFAULT 'EGP',
  idempotency_key text UNIQUE,
  request_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_orders_customer ON trust_orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS trust_orders_request_hash_idx ON trust_orders(idempotency_key, request_hash) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS trust_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES trust_products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_order_items_order ON trust_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_trust_order_items_product ON trust_order_items(product_id);

-- trust_payments.order_id was declared in migration 002 before trust_orders
-- existed, so its FK could not be inline. Attach it now.
ALTER TABLE trust_payments ADD CONSTRAINT trust_payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES trust_orders(id) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS trust_idempotency_keys (
  key_hash text NOT NULL,
  scope text NOT NULL,
  result_json jsonb NOT NULL,
  request_hash text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key_hash, scope)
);
CREATE INDEX IF NOT EXISTS idx_trust_idempotency_keys_expiry ON trust_idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS trust_idempotency_scope_expiry_idx ON trust_idempotency_keys(scope, expires_at);
CREATE INDEX IF NOT EXISTS trust_idempotency_request_hash_idx ON trust_idempotency_keys(scope, request_hash) WHERE request_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS trust_inventory_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES trust_products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','released','consumed','expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_inventory_reservations_order ON trust_inventory_reservations(order_id);
CREATE INDEX IF NOT EXISTS trust_inventory_reservation_expiry_idx ON trust_inventory_reservations(status, expires_at);

CREATE TABLE IF NOT EXISTS trust_inventory_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES trust_products(id),
  delta integer NOT NULL,
  reason text NOT NULL,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_inventory_ledger_product ON trust_inventory_ledger(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  payment_intent_id text NOT NULL,
  status text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_event_id)
);
CREATE INDEX IF NOT EXISTS trust_payment_events_intent_idx ON trust_payment_events(payment_intent_id, received_at DESC);
CREATE INDEX IF NOT EXISTS trust_payment_events_race_idx ON trust_payment_events(provider, payment_intent_id, received_at DESC);
