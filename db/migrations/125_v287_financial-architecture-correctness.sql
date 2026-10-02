-- V287 — close financial architecture correctness gaps: immutable dispute allocations,
-- payout reconciliation workflow, provider-event replay, currency ownership and ledger account semantics.

ALTER TABLE trust_marketplace_payout_reconciliations
  ADD COLUMN IF NOT EXISTS workflow_status text NOT NULL DEFAULT 'OPEN'
    CHECK(workflow_status IN ('OPEN','INVESTIGATING','EVIDENCE_REVIEW','ADJUSTMENT_PENDING','RESOLVED')),
  ADD COLUMN IF NOT EXISTS evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_actor_id uuid,
  ADD COLUMN IF NOT EXISTS resolution_decision text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS trust_marketplace_reconciliation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id uuid NOT NULL REFERENCES trust_marketplace_payout_reconciliations(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK(decision IN ('ACCEPT_VARIANCE','REQUIRE_PROVIDER_RETRY')),
  adjustment_amount numeric(18,2) NOT NULL DEFAULT 0,
  note text,
  actor_id uuid,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_recon_actions_reconciliation ON trust_marketplace_reconciliation_actions(reconciliation_id,created_at DESC);

CREATE OR REPLACE FUNCTION trust_block_dispute_allocation_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'DISPUTE_ALLOCATION_IMMUTABLE';
END;
$$;
DROP TRIGGER IF EXISTS trg_marketplace_dispute_allocations_immutable ON trust_marketplace_dispute_allocations;
CREATE TRIGGER trg_marketplace_dispute_allocations_immutable
BEFORE UPDATE OR DELETE ON trust_marketplace_dispute_allocations
FOR EACH ROW EXECUTE FUNCTION trust_block_dispute_allocation_mutation();

-- Legacy V283/V284 entries had merchant ownership on PLATFORM_FEE rows. Correct the ledger
-- ownership before enforcing the invariant: platform income belongs to the platform account.
UPDATE trust_marketplace_payment_ledger
SET merchant_id=NULL
WHERE entry_type='PLATFORM_FEE' AND merchant_id IS NOT NULL;

ALTER TABLE trust_marketplace_payment_ledger
  DROP CONSTRAINT IF EXISTS trust_marketplace_payment_ledger_account_owner_ck;
ALTER TABLE trust_marketplace_payment_ledger
  ADD CONSTRAINT trust_marketplace_payment_ledger_account_owner_ck CHECK (
    (entry_type IN ('CUSTOMER_CHARGE','PLATFORM_FEE') AND merchant_id IS NULL)
    OR
    (entry_type IN ('SELLER_CREDIT','PAYMENT_FEE','TAX_HOLD','REFUND','CHARGEBACK','PAYOUT','PAYOUT_REVERSAL','HOLD','RELEASE','PAYOUT_ADJUSTMENT') AND merchant_id IS NOT NULL)
  );

ALTER TABLE trust_marketplace_payment_ledger
  DROP CONSTRAINT IF EXISTS trust_marketplace_payment_ledger_entry_type_ck;
ALTER TABLE trust_marketplace_payment_ledger
  ADD CONSTRAINT trust_marketplace_payment_ledger_entry_type_ck CHECK(entry_type IN (
    'CUSTOMER_CHARGE','SELLER_CREDIT','PLATFORM_FEE','PAYMENT_FEE','TAX_HOLD','REFUND',
    'CHARGEBACK','PAYOUT','PAYOUT_REVERSAL','HOLD','RELEASE','PAYOUT_ADJUSTMENT'
  ));

-- Prevent a seller's single-currency balance bucket from silently mixing currencies.
CREATE OR REPLACE FUNCTION trust_enforce_seller_balance_currency() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='UPDATE' AND NEW.currency<>OLD.currency THEN
    RAISE EXCEPTION 'SELLER_BALANCE_CURRENCY_IMMUTABLE';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_marketplace_seller_balance_currency ON trust_marketplace_seller_balances;
CREATE TRIGGER trg_marketplace_seller_balance_currency
BEFORE UPDATE ON trust_marketplace_seller_balances
FOR EACH ROW EXECUTE FUNCTION trust_enforce_seller_balance_currency();

CREATE INDEX IF NOT EXISTS idx_marketplace_payout_recon_workflow ON trust_marketplace_payout_reconciliations(workflow_status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_disputes_provider_case ON trust_marketplace_disputes(provider,provider_case_id) WHERE provider_case_id IS NOT NULL;
