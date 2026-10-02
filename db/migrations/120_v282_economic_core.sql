-- V282 — Economic Core: unified fees, payment splits, seller balances and return financials.
CREATE TABLE IF NOT EXISTS trust_marketplace_fee_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  category text, seller_plan text, fee_type text NOT NULL, program_code text NOT NULL,
  rate_bps integer NOT NULL DEFAULT 0 CHECK(rate_bps BETWEEN 0 AND 10000), minimum_fee numeric(18,2) NOT NULL DEFAULT 0 CHECK(minimum_fee>=0),
  maximum_fee numeric(18,2), volume_threshold numeric(18,2), volume_rate_bps integer, negotiated boolean NOT NULL DEFAULT false,
  starts_at timestamptz NOT NULL DEFAULT now(), ends_at timestamptz, active boolean NOT NULL DEFAULT true,
  CHECK(maximum_fee IS NULL OR maximum_fee>=minimum_fee), CHECK(volume_rate_bps IS NULL OR volume_rate_bps BETWEEN 0 AND 10000)
);
CREATE INDEX IF NOT EXISTS idx_fee_rules_lookup ON trust_marketplace_fee_rules(active,fee_type,program_code,merchant_id,category);

CREATE TABLE IF NOT EXISTS trust_marketplace_fee_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid REFERENCES trust_orders(id) ON DELETE SET NULL,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE, fee_type text NOT NULL, program_code text NOT NULL,
  base_amount numeric(18,2) NOT NULL CHECK(base_amount>=0), rate_bps integer NOT NULL CHECK(rate_bps>=0), fee_amount numeric(18,2) NOT NULL CHECK(fee_amount>=0),
  currency text NOT NULL DEFAULT 'EGP', rule_id uuid REFERENCES trust_marketplace_fee_rules(id) ON DELETE SET NULL, idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_fee_assessments_order ON trust_marketplace_fee_assessments(order_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_payment_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid REFERENCES trust_orders(id) ON DELETE SET NULL, payment_id uuid REFERENCES trust_payments(id) ON DELETE SET NULL,
  merchant_id uuid REFERENCES trust_merchant_profiles(id) ON DELETE SET NULL, entry_type text NOT NULL CHECK(entry_type IN ('CUSTOMER_CHARGE','SELLER_CREDIT','PLATFORM_FEE','PAYMENT_FEE','TAX_HOLD','REFUND','CHARGEBACK','PAYOUT','PAYOUT_REVERSAL','HOLD','RELEASE')),
  amount numeric(18,2) NOT NULL CHECK(amount>=0), direction text NOT NULL CHECK(direction IN ('CREDIT','DEBIT')), currency text NOT NULL DEFAULT 'EGP', idempotency_key text NOT NULL,
  available_at timestamptz, metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_merchant ON trust_marketplace_payment_ledger(merchant_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_order ON trust_marketplace_payment_ledger(order_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_marketplace_seller_balances (
  merchant_id uuid PRIMARY KEY REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  pending_balance numeric(18,2) NOT NULL DEFAULT 0 CHECK(pending_balance>=0), available_balance numeric(18,2) NOT NULL DEFAULT 0 CHECK(available_balance>=0), held_balance numeric(18,2) NOT NULL DEFAULT 0 CHECK(held_balance>=0), currency text NOT NULL DEFAULT 'EGP', updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trust_returns ADD COLUMN IF NOT EXISTS financial_status text NOT NULL DEFAULT 'PENDING' CHECK(financial_status IN ('PENDING','CALCULATED','REFUND_PENDING','REFUNDED','REVERSED'));
ALTER TABLE trust_returns ADD COLUMN IF NOT EXISTS disposition text CHECK(disposition IN ('RESTOCK','REFURBISH','LIQUIDATE','SELLER_RETURN','DAMAGED','COUNTERFEIT_REVIEW'));
ALTER TABLE trust_returns ADD COLUMN IF NOT EXISTS refund_amount numeric(18,2) CHECK(refund_amount IS NULL OR refund_amount>=0);

CREATE TABLE IF NOT EXISTS trust_marketplace_return_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), return_id uuid NOT NULL REFERENCES trust_returns(id) ON DELETE CASCADE, gross_refund numeric(18,2) NOT NULL CHECK(gross_refund>=0), fee_reversal numeric(18,2) NOT NULL DEFAULT 0 CHECK(fee_reversal>=0), shipping_refund numeric(18,2) NOT NULL DEFAULT 0 CHECK(shipping_refund>=0), net_refund numeric(18,2) NOT NULL CHECK(net_refund>=0), currency text NOT NULL DEFAULT 'EGP', idempotency_key text NOT NULL UNIQUE, calculation_json jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
