-- V281 — promotion correctness, lifecycle, stacking policy and dynamic-price decision history.
-- V280 promotion accounting used effective unit prices plus a discount ledger, which could double-discount deals.
-- V281 makes base prices authoritative and records every dynamic pricing decision separately.

ALTER TABLE trust_marketplace_offers DROP CONSTRAINT IF EXISTS trust_marketplace_offers_product_id_key;

ALTER TABLE trust_marketplace_coupons
  ADD COLUMN IF NOT EXISTS stacking_policy text NOT NULL DEFAULT 'STACK_DEAL' CHECK (stacking_policy IN ('EXCLUSIVE','STACK_DEAL','STACK_ALL')),
  ADD COLUMN IF NOT EXISTS category_scope text,
  ADD COLUMN IF NOT EXISTS first_order_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_segment text,
  ADD COLUMN IF NOT EXISTS discount_target text NOT NULL DEFAULT 'ITEMS' CHECK (discount_target IN ('ITEMS','SHIPPING'));

ALTER TABLE trust_marketplace_price_history
  ADD COLUMN IF NOT EXISTS rule_id uuid REFERENCES trust_marketplace_dynamic_price_rules(offer_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS decision_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS inputs_json jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS uq_marketplace_price_history_decision ON trust_marketplace_price_history(decision_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_coupons_scope ON trust_marketplace_coupons(merchant_id,category_scope,status,starts_at,ends_at);

CREATE TABLE IF NOT EXISTS trust_marketplace_customer_segments (
  customer_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE CASCADE,
  segment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(customer_id,segment)
);

CREATE OR REPLACE FUNCTION trust_sync_marketplace_promotion_lifecycle()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE trust_marketplace_deals
     SET status='ACTIVE', updated_at=now()
   WHERE status='SCHEDULED' AND starts_at<=now() AND ends_at>now();
  UPDATE trust_marketplace_deals
     SET status='EXPIRED', updated_at=now()
   WHERE status IN ('SCHEDULED','ACTIVE') AND ends_at<=now();
  UPDATE trust_marketplace_coupons
     SET status='ACTIVE', updated_at=now()
   WHERE status='SCHEDULED' AND starts_at<=now() AND ends_at>now();
  UPDATE trust_marketplace_coupons
     SET status='EXPIRED', updated_at=now()
   WHERE status IN ('SCHEDULED','ACTIVE') AND ends_at<=now();
  UPDATE trust_marketplace_vouchers
     SET status='EXPIRED', updated_at=now()
   WHERE status='ACTIVE' AND expires_at IS NOT NULL AND expires_at<=now();
END;
$$;

ALTER TABLE trust_marketplace_dynamic_price_rules
  ADD COLUMN IF NOT EXISTS min_dwell_minutes integer NOT NULL DEFAULT 60 CHECK (min_dwell_minutes >= 0),
  ADD COLUMN IF NOT EXISTS seller_max_change_bps integer NOT NULL DEFAULT 1000 CHECK (seller_max_change_bps BETWEEN 0 AND 3000),
  ADD COLUMN IF NOT EXISTS approval_threshold_bps integer NOT NULL DEFAULT 0 CHECK (approval_threshold_bps BETWEEN 0 AND 3000);

CREATE TABLE IF NOT EXISTS trust_marketplace_dynamic_price_signals (
  offer_id uuid PRIMARY KEY REFERENCES trust_marketplace_offers(id) ON DELETE CASCADE,
  demand_velocity numeric(12,4) NOT NULL DEFAULT 0 CHECK (demand_velocity >= 0),
  conversion_rate numeric(8,6) NOT NULL DEFAULT 0 CHECK (conversion_rate BETWEEN 0 AND 1),
  competitor_price numeric(12,2) CHECK (competitor_price IS NULL OR competitor_price > 0),
  elasticity numeric(8,4),
  observed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trust_marketplace_coupon_redemptions
  ADD COLUMN IF NOT EXISTS reversed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reversal_idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS uq_coupon_redemption_reversal ON trust_marketplace_coupon_redemptions(reversal_idempotency_key) WHERE reversal_idempotency_key IS NOT NULL;

ALTER TABLE trust_marketplace_voucher_redemptions
  ADD COLUMN IF NOT EXISTS reversed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reversal_idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS uq_voucher_redemption_reversal ON trust_marketplace_voucher_redemptions(reversal_idempotency_key) WHERE reversal_idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS trust_marketplace_promotion_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('DEAL','COUPON','VOUCHER')),
  promotion_id text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reversed_at timestamptz,
  reversal_idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_marketplace_promotion_application ON trust_marketplace_promotion_applications(order_id,kind,promotion_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_marketplace_promotion_application_reversal ON trust_marketplace_promotion_applications(reversal_idempotency_key) WHERE reversal_idempotency_key IS NOT NULL;
