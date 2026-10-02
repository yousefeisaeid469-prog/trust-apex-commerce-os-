-- V284 — close the durable seller-money loop: delivery release, payouts, reconciliation and reversals.
CREATE TABLE IF NOT EXISTS trust_marketplace_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  amount numeric(18,2) NOT NULL CHECK(amount>0),
  currency text NOT NULL DEFAULT 'EGP',
  status text NOT NULL DEFAULT 'REQUESTED' CHECK(status IN ('REQUESTED','PROCESSING','PAID','FAILED','HELD','REVERSED')),
  provider text,
  provider_reference text,
  idempotency_key text NOT NULL UNIQUE,
  failure_code text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_payouts_merchant_status ON trust_marketplace_payout_requests(merchant_id,status,requested_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_payouts_provider_ref ON trust_marketplace_payout_requests(provider,provider_reference) WHERE provider_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS trust_marketplace_balance_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  settlement_id uuid NOT NULL REFERENCES trust_marketplace_payment_settlements(id) ON DELETE CASCADE,
  amount numeric(18,2) NOT NULL CHECK(amount>=0),
  currency text NOT NULL DEFAULT 'EGP',
  status text NOT NULL DEFAULT 'RELEASED' CHECK(status IN ('RELEASED','REVERSED')),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_releases_order ON trust_marketplace_balance_releases(order_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_reconciliation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  status text NOT NULL CHECK(status IN ('RUNNING','SUCCEEDED','FAILED')),
  checked_count integer NOT NULL DEFAULT 0,
  mismatch_count integer NOT NULL DEFAULT 0,
  details_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE trust_marketplace_payment_settlements ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE trust_marketplace_payment_settlements ADD COLUMN IF NOT EXISTS released_at timestamptz;
ALTER TABLE trust_marketplace_payment_settlements ADD COLUMN IF NOT EXISTS reversed_at timestamptz;
