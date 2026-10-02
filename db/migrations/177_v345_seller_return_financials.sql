-- V345 — seller-scoped returns/refunds and financial reversals.
-- A customer return can contain items from multiple sellers; each returned item
-- retains its seller order so refund allocation is deterministic per merchant.
ALTER TABLE trust_return_items
  ADD COLUMN IF NOT EXISTS seller_order_id uuid REFERENCES trust_seller_orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS trust_return_items_seller_order_idx
  ON trust_return_items(seller_order_id,created_at ASC);

-- Backfill historical return items from the order item's seller-order binding.
UPDATE trust_return_items ri
SET seller_order_id = oi.seller_order_id
FROM trust_order_items oi
WHERE oi.id = ri.order_item_id
  AND ri.seller_order_id IS NULL;

ALTER TABLE trust_seller_order_financials
  ADD COLUMN IF NOT EXISTS refunded_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(refunded_amount >= 0);
CREATE INDEX IF NOT EXISTS trust_seller_order_financials_refunded_idx
  ON trust_seller_order_financials(seller_order_id,refunded_amount);

CREATE TABLE IF NOT EXISTS trust_seller_return_refund_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id uuid NOT NULL REFERENCES trust_refunds(id) ON DELETE CASCADE,
  return_id uuid NOT NULL REFERENCES trust_returns(id) ON DELETE CASCADE,
  seller_order_id uuid NOT NULL REFERENCES trust_seller_orders(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE RESTRICT,
  amount numeric(18,2) NOT NULL CHECK(amount > 0),
  currency char(3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(refund_id,seller_order_id)
);
CREATE INDEX IF NOT EXISTS trust_seller_return_refund_alloc_return_idx
  ON trust_seller_return_refund_allocations(return_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_seller_return_refund_alloc_merchant_idx
  ON trust_seller_return_refund_allocations(merchant_id,created_at DESC);
