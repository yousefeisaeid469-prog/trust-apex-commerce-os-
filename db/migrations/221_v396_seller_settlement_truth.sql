-- V396 — seller settlement truth and marketplace financial invariants.
-- The customer order remains aggregate, but every seller order becomes an
-- auditable financial unit. This migration is additive and idempotent.

ALTER TABLE trust_marketplace_fee_ledger
  ADD COLUMN IF NOT EXISTS seller_order_id uuid REFERENCES trust_seller_orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS trust_marketplace_fee_ledger_seller_order_idx
  ON trust_marketplace_fee_ledger(seller_order_id,created_at DESC);

ALTER TABLE trust_marketplace_fulfillment_cost_ledger
  ADD COLUMN IF NOT EXISTS seller_order_id uuid REFERENCES trust_seller_orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS trust_marketplace_fulfillment_cost_ledger_seller_order_idx
  ON trust_marketplace_fulfillment_cost_ledger(seller_order_id,created_at DESC);

UPDATE trust_marketplace_fulfillment_cost_ledger c
SET seller_order_id=f.seller_order_id
FROM trust_marketplace_fulfillment_orders f
WHERE c.fulfillment_order_id=f.id
  AND c.seller_order_id IS NULL
  AND f.seller_order_id IS NOT NULL;

ALTER TABLE trust_marketplace_payment_settlements
  ADD COLUMN IF NOT EXISTS seller_order_count integer NOT NULL DEFAULT 0 CHECK(seller_order_count >= 0),
  ADD COLUMN IF NOT EXISTS accounting_delta numeric(18,2) NOT NULL DEFAULT 0 CHECK(accounting_delta >= 0);

ALTER TABLE trust_seller_order_financials
  ADD COLUMN IF NOT EXISTS platform_fee_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(platform_fee_amount >= 0),
  ADD COLUMN IF NOT EXISTS payment_fee_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(payment_fee_amount >= 0),
  ADD COLUMN IF NOT EXISTS fulfillment_fee_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(fulfillment_fee_amount >= 0),
  ADD COLUMN IF NOT EXISTS return_fee_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(return_fee_amount >= 0),
  ADD COLUMN IF NOT EXISTS gross_customer_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(gross_customer_amount >= 0);

CREATE INDEX IF NOT EXISTS trust_seller_order_financials_settlement_idx
  ON trust_seller_order_financials(settlement_id,merchant_id);

-- Backfill seller financial snapshots for historical settlements. This does not
-- invent money: every amount comes from the authoritative seller order, the
-- existing settlement receipt, fee assessments, or payment ledger.
INSERT INTO trust_seller_order_financials(
  seller_order_id,merchant_id,settlement_id,payment_id,gross_amount,gross_customer_amount,
  seller_credit_amount,released_amount,platform_fee_amount,payment_fee_amount,
  fulfillment_fee_amount,return_fee_amount,currency,status
)
SELECT
  so.id,
  so.merchant_id,
  s.id,
  s.payment_id,
  so.total,
  so.total,
  coalesce((select sum(l.amount) from trust_marketplace_payment_ledger l where l.payment_id=s.payment_id and l.merchant_id=so.merchant_id and l.entry_type='SELLER_CREDIT' and l.direction='CREDIT'),0),
  coalesce((select sum(br.amount) from trust_marketplace_balance_releases br where br.order_id=so.order_id and br.merchant_id=so.merchant_id and br.status='RELEASED'),0),
  coalesce((select sum(fa.fee_amount) from trust_marketplace_fee_assessments fa where fa.order_id=so.order_id and fa.merchant_id=so.merchant_id and fa.fee_type='REFERRAL'),0),
  coalesce((select sum(fa.fee_amount) from trust_marketplace_fee_assessments fa where fa.order_id=so.order_id and fa.merchant_id=so.merchant_id and fa.fee_type='PAYMENT'),0),
  coalesce((select sum(fa.fee_amount) from trust_marketplace_fee_assessments fa where fa.order_id=so.order_id and fa.merchant_id=so.merchant_id and fa.fee_type='FULFILLMENT'),0),
  coalesce((select sum(fa.fee_amount) from trust_marketplace_fee_assessments fa where fa.order_id=so.order_id and fa.merchant_id=so.merchant_id and fa.fee_type='RETURN'),0),
  s.currency,
  case when coalesce((select sum(br.amount) from trust_marketplace_balance_releases br where br.order_id=so.order_id and br.merchant_id=so.merchant_id and br.status='RELEASED'),0)>0 then 'RELEASED' else 'PENDING' end
FROM trust_seller_orders so
JOIN trust_marketplace_payment_settlements s ON s.order_id=so.order_id
ON CONFLICT(seller_order_id) DO UPDATE SET
  settlement_id=excluded.settlement_id,
  payment_id=excluded.payment_id,
  gross_amount=excluded.gross_amount,
  gross_customer_amount=excluded.gross_customer_amount,
  seller_credit_amount=excluded.seller_credit_amount,
  released_amount=greatest(trust_seller_order_financials.released_amount,excluded.released_amount),
  platform_fee_amount=excluded.platform_fee_amount,
  payment_fee_amount=excluded.payment_fee_amount,
  fulfillment_fee_amount=excluded.fulfillment_fee_amount,
  return_fee_amount=excluded.return_fee_amount,
  currency=excluded.currency,
  updated_at=now();

UPDATE trust_marketplace_payment_settlements s
SET seller_order_count=x.seller_order_count,
    accounting_delta=x.accounting_delta,
    updated_at=now()
FROM (
  SELECT s2.id, count(so.id)::int seller_order_count,
         greatest(0,round((s2.gross_amount - s2.seller_net - s2.platform_fee - s2.payment_fee - s2.fulfillment_fee - s2.return_fee)::numeric,2)) accounting_delta
  FROM trust_marketplace_payment_settlements s2
  LEFT JOIN trust_seller_orders so ON so.order_id=s2.order_id
  GROUP BY s2.id
) x
WHERE s.id=x.id;

-- One canonical read model for seller-level settlement truth. A row is emitted
-- even when financials are missing, so the verifier can detect incomplete wiring.
CREATE OR REPLACE VIEW trust_seller_settlement_truth AS
WITH item_rollup AS (
  SELECT oi.seller_order_id,
         round(coalesce(sum(oi.unit_price * oi.quantity),0)::numeric,2) AS item_subtotal,
         count(*)::int AS item_rows
  FROM trust_order_items oi
  WHERE oi.seller_order_id IS NOT NULL
  GROUP BY oi.seller_order_id
),
fee_rollup AS (
  SELECT fl.seller_order_id,
         round(coalesce(sum(fl.fee_amount) FILTER (WHERE fl.fee_type='REFERRAL'),0)::numeric,2) AS referral_fee,
         round(coalesce(sum(fl.fee_amount) FILTER (WHERE fl.fee_type='PAYMENT'),0)::numeric,2) AS payment_fee,
         round(coalesce(sum(fl.fee_amount) FILTER (WHERE fl.fee_type='FULFILLMENT'),0)::numeric,2) AS fulfillment_fee,
         round(coalesce(sum(fl.fee_amount) FILTER (WHERE fl.fee_type='RETURN'),0)::numeric,2) AS return_fee
  FROM trust_marketplace_fee_ledger fl
  WHERE fl.seller_order_id IS NOT NULL
  GROUP BY fl.seller_order_id
),
refund_rollup AS (
  SELECT a.seller_order_id,
         round(coalesce(sum(a.amount) FILTER (WHERE r.status IN ('requested','processing','succeeded')),0)::numeric,2) AS refunded_amount
  FROM trust_seller_return_refund_allocations a
  JOIN trust_refunds r ON r.id=a.refund_id
  GROUP BY a.seller_order_id
),
payout_rollup AS (
  SELECT a.seller_order_id,
         round(coalesce(sum(a.amount) FILTER (WHERE p.status IN ('REQUESTED','PROCESSING','HELD','PAID')),0)::numeric,2) AS payout_allocated
  FROM trust_marketplace_payout_eligibility_allocations a
  JOIN trust_marketplace_payout_requests p ON p.id=a.payout_id
  WHERE a.seller_order_id IS NOT NULL
  GROUP BY a.seller_order_id
),
legacy_payout_rollup AS (
  SELECT a.seller_order_id,
         round(coalesce(sum(a.amount) FILTER (WHERE p.status IN ('REQUESTED','PROCESSING','HELD','PAID')),0)::numeric,2) AS legacy_payout_allocated
  FROM trust_seller_order_payout_allocations a
  JOIN trust_marketplace_payout_requests p ON p.id=a.payout_id
  GROUP BY a.seller_order_id
)
SELECT
  so.id AS seller_order_id,
  so.order_id,
  so.merchant_id,
  so.currency,
  so.status AS seller_order_status,
  round(so.subtotal::numeric,2) AS subtotal,
  round(so.discount::numeric,2) AS discount,
  round(so.shipping::numeric,2) AS shipping,
  round(so.total::numeric,2) AS seller_order_total,
  coalesce(ir.item_subtotal,0)::numeric AS item_subtotal,
  coalesce(sf.gross_customer_amount,0)::numeric AS gross_customer_amount,
  coalesce(sf.seller_credit_amount,0)::numeric AS seller_credit_amount,
  coalesce(sf.released_amount,0)::numeric AS released_amount,
  coalesce(sf.refunded_amount,0)::numeric AS financial_refunded_amount,
  coalesce(fr.refunded_amount,0)::numeric AS allocated_refunded_amount,
  coalesce(sf.platform_fee_amount,0)::numeric AS platform_fee_amount,
  coalesce(sf.payment_fee_amount,0)::numeric AS payment_fee_amount,
  coalesce(sf.fulfillment_fee_amount,0)::numeric AS fulfillment_fee_amount,
  coalesce(sf.return_fee_amount,0)::numeric AS return_fee_amount,
  coalesce(pr.payout_allocated,0)::numeric AS payout_allocated,
  coalesce(lpr.legacy_payout_allocated,0)::numeric AS legacy_payout_allocated,
  round((so.total - coalesce(sf.seller_credit_amount,0) - coalesce(sf.platform_fee_amount,0) - coalesce(sf.payment_fee_amount,0) - coalesce(sf.fulfillment_fee_amount,0) - coalesce(sf.return_fee_amount))::numeric,2) AS settlement_delta,
  round((coalesce(sf.released_amount,0) - coalesce(sf.refunded_amount,0) - coalesce(pr.payout_allocated,0) - coalesce(lpr.legacy_payout_allocated,0))::numeric,2) AS payout_available_delta,
  CASE
    WHEN sf.seller_order_id IS NULL THEN 'FINANCIALS_MISSING'
    WHEN abs(so.subtotal - coalesce(ir.item_subtotal,0)) > 0.01 THEN 'ITEM_SUBTOTAL_MISMATCH'
    WHEN abs(so.total - coalesce(sf.gross_customer_amount,0)) > 0.01 THEN 'GROSS_TOTAL_MISMATCH'
    WHEN abs(so.total - coalesce(sf.seller_credit_amount,0) - coalesce(sf.platform_fee_amount,0) - coalesce(sf.payment_fee_amount,0) - coalesce(sf.fulfillment_fee_amount,0) - coalesce(sf.return_fee_amount)) > 0.01 THEN 'SETTLEMENT_NOT_BALANCED'
    WHEN coalesce(pr.payout_allocated,0) + coalesce(lpr.legacy_payout_allocated,0) > greatest(0,coalesce(sf.released_amount,0) - coalesce(sf.refunded_amount,0)) + 0.01 THEN 'PAYOUT_OVERALLOCATED'
    WHEN abs(coalesce(sf.refunded_amount,0) - coalesce(fr.refunded_amount,0)) > 0.01 THEN 'REFUND_ALLOCATION_MISMATCH'
    ELSE 'OK'
  END AS truth_status
FROM trust_seller_orders so
LEFT JOIN item_rollup ir ON ir.seller_order_id=so.id
LEFT JOIN trust_seller_order_financials sf ON sf.seller_order_id=so.id
LEFT JOIN fee_rollup f ON f.seller_order_id=so.id
LEFT JOIN refund_rollup fr ON fr.seller_order_id=so.id
LEFT JOIN payout_rollup pr ON pr.seller_order_id=so.id
LEFT JOIN legacy_payout_rollup lpr ON lpr.seller_order_id=so.id;

CREATE INDEX IF NOT EXISTS trust_seller_order_financials_truth_merchant_idx
  ON trust_seller_order_financials(merchant_id,currency,status,updated_at DESC);
