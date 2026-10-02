-- V347 — execute seller-dispute customer resolutions through the real refund pipeline.
-- A dispute hold is a reserve until the payment provider confirms the refund.
ALTER TABLE trust_refunds
  ADD COLUMN IF NOT EXISTS dispute_case_id uuid REFERENCES trust_seller_dispute_cases(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS trust_refunds_dispute_case_unique
  ON trust_refunds(dispute_case_id) WHERE dispute_case_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS trust_refunds_dispute_case_idx
  ON trust_refunds(dispute_case_id,created_at DESC) WHERE dispute_case_id IS NOT NULL;

ALTER TABLE trust_seller_dispute_cases
  ADD COLUMN IF NOT EXISTS refund_id uuid REFERENCES trust_refunds(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS refund_status text NOT NULL DEFAULT 'NOT_REQUESTED'
    CHECK(refund_status IN ('NOT_REQUESTED','REQUESTED','PROCESSING','SUCCEEDED','FAILED','NOT_REQUIRED')),
  ADD COLUMN IF NOT EXISTS refunded_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(refunded_amount >= 0);
CREATE INDEX IF NOT EXISTS trust_seller_dispute_cases_refund_idx
  ON trust_seller_dispute_cases(refund_id,refund_status);

-- Do not allow a new customer-winning resolution to coexist with another refund
-- request for the same dispute. The unique refund_case link is the authoritative guard.
