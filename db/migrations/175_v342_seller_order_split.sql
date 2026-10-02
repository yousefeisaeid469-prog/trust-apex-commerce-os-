-- V342: durable multi-seller order splitting.
-- One customer order remains the public aggregate; each merchant receives a
-- first-class seller order for its own items, shipping, status and settlement.
CREATE TABLE IF NOT EXISTS trust_seller_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE RESTRICT,
  seller_order_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'PLACED' CHECK(status IN ('PLACED','ACCEPTED','PROCESSING','READY_FOR_HANDOFF','SHIPPED','DELIVERED','CANCELLED','REFUNDED','EXCEPTION')),
  subtotal numeric(18,2) NOT NULL DEFAULT 0 CHECK(subtotal >= 0),
  discount numeric(18,2) NOT NULL DEFAULT 0 CHECK(discount >= 0),
  shipping numeric(18,2) NOT NULL DEFAULT 0 CHECK(shipping >= 0),
  total numeric(18,2) NOT NULL DEFAULT 0 CHECK(total >= 0),
  currency char(3) NOT NULL,
  item_count integer NOT NULL DEFAULT 0 CHECK(item_count > 0),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, merchant_id)
);
CREATE INDEX IF NOT EXISTS trust_seller_orders_merchant_status_idx ON trust_seller_orders(merchant_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_seller_orders_order_idx ON trust_seller_orders(order_id,created_at ASC);

ALTER TABLE trust_order_items
  ADD COLUMN IF NOT EXISTS seller_order_id uuid REFERENCES trust_seller_orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS trust_order_items_seller_order_idx ON trust_order_items(seller_order_id);

CREATE TABLE IF NOT EXISTS trust_seller_order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_order_id uuid NOT NULL REFERENCES trust_seller_orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  actor_id uuid,
  event_key text NOT NULL UNIQUE,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_seller_order_events_order_idx ON trust_seller_order_events(seller_order_id,created_at ASC);
