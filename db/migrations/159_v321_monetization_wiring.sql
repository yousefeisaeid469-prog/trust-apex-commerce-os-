-- V321: Wire monetization into the real payment settlement/refund path.
-- Additive: existing tables and APIs remain intact.

-- Default marketplace referral/commission policy: 20% of seller gross.
-- Merchant/category-specific rules still take precedence in economic-settlement.ts.
INSERT INTO trust_marketplace_fee_rules
  (merchant_id, category, seller_plan, fee_type, program_code, rate_bps, minimum_fee, active)
SELECT NULL, NULL, NULL, 'REFERRAL', 'MARKETPLACE_DEFAULT', 2000, 0, true
WHERE NOT EXISTS (
  SELECT 1 FROM trust_marketplace_fee_rules
  WHERE merchant_id IS NULL AND category IS NULL AND fee_type='REFERRAL'
    AND active=true AND starts_at<=now() AND (ends_at IS NULL OR ends_at>now())
);

CREATE INDEX IF NOT EXISTS trust_revenue_ledger_reference_idx
  ON trust_revenue_ledger(reference_type, reference_id);
