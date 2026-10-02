-- V323 — Financial close: durable accounting invariants and payout event completion.
-- Additive. No existing tables or APIs are removed.

CREATE TABLE IF NOT EXISTS trust_financial_close_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  status text NOT NULL CHECK(status IN ('RUNNING','SUCCEEDED','FAILED')),
  checked_settlements integer NOT NULL DEFAULT 0,
  checked_refunds integer NOT NULL DEFAULT 0,
  checked_payouts integer NOT NULL DEFAULT 0,
  checked_revenue integer NOT NULL DEFAULT 0,
  mismatch_count integer NOT NULL DEFAULT 0,
  mismatches_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_trust_financial_close_runs_created
  ON trust_financial_close_runs(created_at DESC);

CREATE TABLE IF NOT EXISTS trust_financial_close_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES trust_financial_close_runs(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  check_code text NOT NULL,
  expected_amount numeric(18,2),
  observed_amount numeric(18,2),
  status text NOT NULL CHECK(status IN ('PASS','MISMATCH')),
  details_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(run_id,entity_type,entity_id,check_code)
);
CREATE INDEX IF NOT EXISTS idx_trust_financial_close_items_run
  ON trust_financial_close_items(run_id,status,entity_type);

CREATE INDEX IF NOT EXISTS idx_trust_revenue_ledger_idempotency
  ON trust_revenue_ledger(idempotency_key);

-- V282's original check predates the explicit adjustment entry used by V287.
-- Keep the invariant explicit for databases created from the complete migration chain.
ALTER TABLE trust_marketplace_payment_ledger
  DROP CONSTRAINT IF EXISTS trust_marketplace_payment_ledger_entry_type_ck;
ALTER TABLE trust_marketplace_payment_ledger
  ADD CONSTRAINT trust_marketplace_payment_ledger_entry_type_ck CHECK(entry_type IN (
    'CUSTOMER_CHARGE','SELLER_CREDIT','PLATFORM_FEE','PAYMENT_FEE','TAX_HOLD','REFUND',
    'CHARGEBACK','PAYOUT','PAYOUT_REVERSAL','HOLD','RELEASE','PAYOUT_ADJUSTMENT'
  ));
