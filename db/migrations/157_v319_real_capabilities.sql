-- V319 — Real capability completion. Additive, durable tables for previously foundation-only surfaces.
CREATE TABLE IF NOT EXISTS trust_gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL UNIQUE,
  code_prefix text NOT NULL,
  owner_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE CASCADE,
  initial_amount numeric(18,2) NOT NULL CHECK(initial_amount>0),
  remaining_amount numeric(18,2) NOT NULL CHECK(remaining_amount>=0 AND remaining_amount<=initial_amount),
  currency char(3) NOT NULL DEFAULT 'EGP',
  recipient_email text,
  status text NOT NULL CHECK(status IN ('ACTIVE','EXHAUSTED','CANCELLED')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_gift_cards_owner ON trust_gift_cards(owner_id,created_at DESC);
CREATE TABLE IF NOT EXISTS trust_gift_card_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), card_id uuid NOT NULL REFERENCES trust_gift_cards(id) ON DELETE RESTRICT,
  order_id text, actor_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK(kind IN ('REDEEM','CANCEL','ADJUSTMENT')),
  amount numeric(18,2) NOT NULL CHECK(amount>0),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_gift_card_tx_card ON trust_gift_card_transactions(card_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_finance_accounts (
  merchant_id uuid PRIMARY KEY REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  currency char(3) NOT NULL DEFAULT 'EGP',
  available_balance numeric(18,2) NOT NULL DEFAULT 0 CHECK(available_balance>=0),
  pending_balance numeric(18,2) NOT NULL DEFAULT 0 CHECK(pending_balance>=0),
  lifetime_gross numeric(18,2) NOT NULL DEFAULT 0 CHECK(lifetime_gross>=0),
  lifetime_fees numeric(18,2) NOT NULL DEFAULT 0 CHECK(lifetime_fees>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_merchant_finance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK(kind IN ('SALE','FEE','PAYOUT','REFUND','ADJUSTMENT')),
  amount numeric(18,2) NOT NULL CHECK(amount>0), currency char(3) NOT NULL,
  status text NOT NULL, reference_type text, reference_id text, idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_merchant_finance_tx ON trust_merchant_finance_transactions(merchant_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_ai_quality_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  subject_id text NOT NULL, model text NOT NULL, input_hash text NOT NULL, expected_hash text, actual_hash text,
  score integer NOT NULL CHECK(score BETWEEN 0 AND 100), status text NOT NULL CHECK(status IN ('PASS','REVIEW','FAIL')),
  checks_json jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_ai_quality_subject ON trust_ai_quality_evaluations(subject_id,created_at DESC);
