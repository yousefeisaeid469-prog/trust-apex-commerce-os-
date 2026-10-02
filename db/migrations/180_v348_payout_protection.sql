-- V348 — durable seller payout eligibility, risk snapshot and payout holds.
-- A payout may only consume funds that are both available on the seller balance
-- and backed by released seller-order economics after refunds and prior payouts.
CREATE TABLE IF NOT EXISTS trust_marketplace_payout_eligibility_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  currency char(3) NOT NULL,
  available_balance numeric(18,2) NOT NULL DEFAULT 0 CHECK(available_balance>=0),
  pending_balance numeric(18,2) NOT NULL DEFAULT 0 CHECK(pending_balance>=0),
  held_balance numeric(18,2) NOT NULL DEFAULT 0 CHECK(held_balance>=0),
  released_order_eligible numeric(18,2) NOT NULL DEFAULT 0 CHECK(released_order_eligible>=0),
  pending_seller_orders numeric(18,2) NOT NULL DEFAULT 0 CHECK(pending_seller_orders>=0),
  dispute_hold numeric(18,2) NOT NULL DEFAULT 0 CHECK(dispute_hold>=0),
  return_exposure numeric(18,2) NOT NULL DEFAULT 0 CHECK(return_exposure>=0),
  refund_provider_exposure numeric(18,2) NOT NULL DEFAULT 0 CHECK(refund_provider_exposure>=0),
  existing_payout_hold numeric(18,2) NOT NULL DEFAULT 0 CHECK(existing_payout_hold>=0),
  eligible_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(eligible_amount>=0),
  requested_amount numeric(18,2),
  decision text NOT NULL CHECK(decision IN ('ELIGIBLE','PARTIAL','BLOCKED')),
  reason text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_payout_eligibility_snapshots_merchant_idx
  ON trust_marketplace_payout_eligibility_snapshots(merchant_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_payout_eligibility_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES trust_marketplace_payout_eligibility_snapshots(id) ON DELETE CASCADE,
  payout_id uuid NOT NULL UNIQUE REFERENCES trust_marketplace_payout_requests(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE RESTRICT,
  amount numeric(18,2) NOT NULL CHECK(amount>0),
  currency char(3) NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','RELEASED','CONSUMED','REVERSED')),
  reason text NOT NULL DEFAULT 'PAYOUT_ELIGIBILITY',
  created_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz
);
CREATE INDEX IF NOT EXISTS trust_payout_eligibility_holds_merchant_idx
  ON trust_marketplace_payout_eligibility_holds(merchant_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_payout_eligibility_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES trust_marketplace_payout_eligibility_snapshots(id) ON DELETE CASCADE,
  payout_id uuid NOT NULL REFERENCES trust_marketplace_payout_requests(id) ON DELETE CASCADE,
  seller_order_id uuid REFERENCES trust_seller_orders(id) ON DELETE SET NULL,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE RESTRICT,
  amount numeric(18,2) NOT NULL CHECK(amount>0),
  currency char(3) NOT NULL,
  reason text NOT NULL CHECK(reason IN ('RELEASED_SELLER_ORDER','NON_ORDER_AVAILABLE','REFUND_RESERVE','DISPUTE_RESERVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(payout_id,seller_order_id,reason)
);
CREATE INDEX IF NOT EXISTS trust_payout_eligibility_allocations_order_idx
  ON trust_marketplace_payout_eligibility_allocations(seller_order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_payout_eligibility_allocations_merchant_idx
  ON trust_marketplace_payout_eligibility_allocations(merchant_id,created_at DESC);

ALTER TABLE trust_marketplace_payout_requests
  ADD COLUMN IF NOT EXISTS eligibility_snapshot_id uuid REFERENCES trust_marketplace_payout_eligibility_snapshots(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS trust_marketplace_payouts_eligibility_idx
  ON trust_marketplace_payout_requests(eligibility_snapshot_id);
