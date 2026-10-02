-- V286 — harden seller financial controls: dispute allocation integrity and reconciliation uniqueness.
ALTER TABLE trust_marketplace_disputes ADD COLUMN IF NOT EXISTS allocation_total numeric(18,2) NOT NULL DEFAULT 0;
ALTER TABLE trust_marketplace_disputes ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_dispute_allocations_merchant ON trust_marketplace_dispute_allocations(dispute_id,merchant_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_disputes_payment_status ON trust_marketplace_disputes(payment_id,status,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_payout_recon_payout_provider_ref ON trust_marketplace_payout_reconciliations(payout_id,provider,provider_reference);
CREATE INDEX IF NOT EXISTS idx_marketplace_payout_recon_status ON trust_marketplace_payout_reconciliations(status,created_at DESC);
