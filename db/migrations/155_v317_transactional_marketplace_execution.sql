-- V317 — one PostgreSQL transaction executes the Marketplace OS vertical slice.
CREATE TABLE IF NOT EXISTS trust_v317_marketplace_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workflow_id text NOT NULL UNIQUE, idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL CHECK(status IN ('READY','RUNNING','BLOCKED','COMPLETED','FAILED')),
  tenant_id uuid NOT NULL REFERENCES trust_tenants(id), seller_id uuid NOT NULL REFERENCES trust_merchant_profiles(id),
  customer_id uuid NOT NULL REFERENCES trust_users(id), product_id uuid NOT NULL REFERENCES trust_products(id), offer_id uuid NOT NULL REFERENCES trust_marketplace_offers(id),
  order_id uuid REFERENCES trust_orders(id) ON DELETE SET NULL, payment_id uuid REFERENCES trust_payments(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES trust_inventory_reservations(id) ON DELETE SET NULL, shipment_id uuid REFERENCES trust_order_shipments(id) ON DELETE SET NULL,
  fulfillment_order_id uuid REFERENCES trust_marketplace_fulfillment_orders(id) ON DELETE SET NULL, settlement_id uuid REFERENCES trust_marketplace_payment_settlements(id) ON DELETE SET NULL,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_v317_execution_tenant ON trust_v317_marketplace_executions(tenant_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_v317_execution_status ON trust_v317_marketplace_executions(status,updated_at DESC);
CREATE TABLE IF NOT EXISTS trust_v317_marketplace_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), execution_id uuid NOT NULL REFERENCES trust_v317_marketplace_executions(id) ON DELETE CASCADE,
  event_type text NOT NULL, payload_json jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(execution_id,event_type)
);
CREATE INDEX IF NOT EXISTS idx_v317_events_execution ON trust_v317_marketplace_events(execution_id,created_at);
