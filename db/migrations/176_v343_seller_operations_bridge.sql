-- V343 — bind seller orders to physical fulfillment and seller-level payout allocations.
-- The customer order remains aggregate; seller orders become the operational unit.
ALTER TABLE trust_marketplace_fulfillment_orders
  ADD COLUMN IF NOT EXISTS seller_order_id uuid REFERENCES trust_seller_orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS trust_marketplace_fulfillment_orders_seller_order_idx
  ON trust_marketplace_fulfillment_orders(seller_order_id,updated_at DESC);

-- Backfill checkout-created order items where V342 already created seller orders.
UPDATE trust_order_items oi
SET seller_order_id = so.id
FROM trust_products p
LEFT JOIN trust_marketplace_offers o ON o.id = oi.offer_id
JOIN trust_seller_orders so
  ON so.order_id = oi.order_id
 AND so.merchant_id = coalesce(o.merchant_id,p.merchant_id)
WHERE oi.product_id = p.id
  AND oi.seller_order_id IS NULL;

CREATE TABLE IF NOT EXISTS trust_seller_order_financials (
  seller_order_id uuid PRIMARY KEY REFERENCES trust_seller_orders(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE RESTRICT,
  settlement_id uuid REFERENCES trust_marketplace_payment_settlements(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES trust_payments(id) ON DELETE SET NULL,
  gross_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(gross_amount >= 0),
  seller_credit_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(seller_credit_amount >= 0),
  released_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(released_amount >= 0),
  currency char(3) NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','RELEASED','PAYOUT_HELD','PAID')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_seller_order_financials_merchant_idx
  ON trust_seller_order_financials(merchant_id,status,updated_at DESC);

ALTER TABLE trust_marketplace_payout_requests
  ADD COLUMN IF NOT EXISTS seller_order_id uuid REFERENCES trust_seller_orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS trust_marketplace_payouts_seller_order_idx
  ON trust_marketplace_payout_requests(seller_order_id,requested_at DESC);

CREATE TABLE IF NOT EXISTS trust_seller_order_payout_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_order_id uuid NOT NULL REFERENCES trust_seller_orders(id) ON DELETE CASCADE,
  payout_id uuid NOT NULL UNIQUE REFERENCES trust_marketplace_payout_requests(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE RESTRICT,
  amount numeric(18,2) NOT NULL CHECK(amount > 0),
  currency char(3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_seller_order_payout_allocations_order_idx
  ON trust_seller_order_payout_allocations(seller_order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_seller_order_payout_allocations_merchant_idx
  ON trust_seller_order_payout_allocations(merchant_id,created_at DESC);
