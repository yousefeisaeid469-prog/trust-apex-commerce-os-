-- V351 — seller financial integrity reconciliation.
-- Detects balance/ledger drift and payout allocation drift without mutating money.
CREATE TABLE IF NOT EXISTS trust_marketplace_reconciliation_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES trust_marketplace_reconciliation_runs(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  currency text NOT NULL,
  finding_type text NOT NULL CHECK(finding_type IN ('BALANCE_LEDGER_DRIFT','PAYOUT_OVERALLOCATION','PAYOUT_HOLD_DRIFT','SELLER_ORDER_PAYOUT_DRIFT')),
  severity text NOT NULL CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  expected_amount numeric(18,2) NOT NULL DEFAULT 0,
  observed_amount numeric(18,2) NOT NULL DEFAULT 0,
  delta numeric(18,2) NOT NULL DEFAULT 0,
  details_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS trust_reconciliation_findings_merchant_idx
  ON trust_marketplace_reconciliation_findings(merchant_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_reconciliation_findings_run_idx
  ON trust_marketplace_reconciliation_findings(run_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_reconciliation_findings_type_idx
  ON trust_marketplace_reconciliation_findings(finding_type,severity,status);

ALTER TABLE trust_marketplace_reconciliation_runs
  ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES trust_merchant_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS error_code text;
CREATE INDEX IF NOT EXISTS trust_reconciliation_runs_scope_idx
  ON trust_marketplace_reconciliation_runs(scope,created_at DESC);


CREATE TABLE IF NOT EXISTS trust_marketplace_reconciliation_finding_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id uuid NOT NULL REFERENCES trust_marketplace_reconciliation_findings(id) ON DELETE CASCADE,
  action text NOT NULL CHECK(action IN ('ACKNOWLEDGE','RESOLVE')),
  actor_id uuid,
  note text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_reconciliation_finding_actions_idx
  ON trust_marketplace_reconciliation_finding_actions(finding_id,created_at DESC);
