-- V285 — durable disputes/chargebacks, payout reconciliation and seller statements.
CREATE TABLE IF NOT EXISTS trust_marketplace_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES trust_payments(id) ON DELETE SET NULL,
  order_id uuid REFERENCES trust_orders(id) ON DELETE SET NULL,
  merchant_id uuid REFERENCES trust_merchant_profiles(id) ON DELETE SET NULL,
  provider text,
  provider_case_id text,
  kind text NOT NULL CHECK(kind IN ('CHARGEBACK','DISPUTE','FRAUD')),
  status text NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','UNDER_REVIEW','WON','LOST','CLOSED')),
  amount numeric(18,2) NOT NULL CHECK(amount>0),
  currency text NOT NULL DEFAULT 'EGP',
  reason_code text,
  evidence_deadline timestamptz,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_disputes_provider_case ON trust_marketplace_disputes(provider,provider_case_id) WHERE provider_case_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketplace_disputes_merchant_status ON trust_marketplace_disputes(merchant_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_dispute_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES trust_marketplace_disputes(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  amount numeric(18,2) NOT NULL CHECK(amount>0),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_marketplace_payout_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES trust_marketplace_payout_requests(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_reference text NOT NULL,
  expected_amount numeric(18,2) NOT NULL CHECK(expected_amount>0),
  settled_amount numeric(18,2),
  status text NOT NULL CHECK(status IN ('MATCHED','MISMATCH','MISSING','DUPLICATE')),
  provider_event_id text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_payout_recon_provider_event ON trust_marketplace_payout_reconciliations(provider,provider_event_id) WHERE provider_event_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS trust_marketplace_seller_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  opening_balance numeric(18,2) NOT NULL DEFAULT 0,
  credits numeric(18,2) NOT NULL DEFAULT 0,
  debits numeric(18,2) NOT NULL DEFAULT 0,
  closing_balance numeric(18,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EGP',
  idempotency_key text NOT NULL UNIQUE,
  generated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(period_end>period_start)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_statements_merchant_period ON trust_marketplace_seller_statements(merchant_id,period_end DESC);
