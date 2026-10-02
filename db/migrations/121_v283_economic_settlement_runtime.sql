-- V283: wire captured payments into fee assessment, seller pending balances and settlement receipts.
CREATE TABLE IF NOT EXISTS trust_marketplace_payment_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES trust_payments(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  gross_amount numeric(18,2) NOT NULL CHECK(gross_amount>=0),
  seller_net numeric(18,2) NOT NULL CHECK(seller_net>=0),
  platform_fee numeric(18,2) NOT NULL DEFAULT 0 CHECK(platform_fee>=0),
  payment_fee numeric(18,2) NOT NULL DEFAULT 0 CHECK(payment_fee>=0),
  fulfillment_fee numeric(18,2) NOT NULL DEFAULT 0 CHECK(fulfillment_fee>=0),
  return_fee numeric(18,2) NOT NULL DEFAULT 0 CHECK(return_fee>=0),
  currency text NOT NULL DEFAULT 'EGP',
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','RELEASED','REVERSED')),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(payment_id)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_settlements_order ON trust_marketplace_payment_settlements(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_settlements_status ON trust_marketplace_payment_settlements(status,created_at);
