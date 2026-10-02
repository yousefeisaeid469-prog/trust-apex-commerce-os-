-- V397 — unified commerce command surface.
-- One read model joins the authoritative order, seller, fulfillment, payment,
-- settlement and revenue authorities. It is diagnostic/read-only by design.

CREATE INDEX IF NOT EXISTS trust_orders_customer_created_idx
  ON trust_orders(customer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_seller_orders_order_merchant_idx
  ON trust_seller_orders(order_id,merchant_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_marketplace_fulfillment_orders_order_status_idx
  ON trust_marketplace_fulfillment_orders(order_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS trust_marketplace_payment_settlements_order_status_idx
  ON trust_marketplace_payment_settlements(order_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS trust_revenue_ledger_order_created_idx
  ON trust_revenue_ledger(order_id,created_at DESC);

CREATE OR REPLACE VIEW trust_commerce_command_snapshot AS
WITH payment_rollup AS (
  SELECT p.order_id,
         count(*)::int AS payment_count,
         coalesce(sum(p.amount) FILTER (WHERE p.status='captured'),0)::numeric(18,2) AS captured_amount,
         max(p.updated_at) AS payment_updated_at
  FROM trust_payments p GROUP BY p.order_id
),
seller_rollup AS (
  SELECT so.order_id,
         count(*)::int AS seller_order_count,
         count(*) FILTER (WHERE so.status IN ('DELIVERED','REFUNDED'))::int AS seller_orders_terminal,
         coalesce(sum(so.total),0)::numeric(18,2) AS seller_order_total,
         max(so.updated_at) AS seller_updated_at
  FROM trust_seller_orders so GROUP BY so.order_id
),
fulfillment_rollup AS (
  SELECT fo.order_id,
         count(*)::int AS fulfillment_count,
         count(*) FILTER (WHERE fo.status='DELIVERED')::int AS fulfillment_delivered,
         count(*) FILTER (WHERE fo.status='EXCEPTION')::int AS fulfillment_exceptions,
         max(fo.updated_at) AS fulfillment_updated_at
  FROM trust_marketplace_fulfillment_orders fo GROUP BY fo.order_id
),
settlement_rollup AS (
  SELECT s.order_id,
         count(*)::int AS settlement_count,
         coalesce(sum(s.seller_net),0)::numeric(18,2) AS seller_net,
         coalesce(sum(s.platform_fee),0)::numeric(18,2) AS platform_fee,
         coalesce(sum(s.payment_fee),0)::numeric(18,2) AS payment_fee,
         coalesce(sum(s.fulfillment_fee),0)::numeric(18,2) AS fulfillment_fee,
         coalesce(sum(s.return_fee),0)::numeric(18,2) AS return_fee,
         max(s.updated_at) AS settlement_updated_at
  FROM trust_marketplace_payment_settlements s GROUP BY s.order_id
),
revenue_rollup AS (
  SELECT r.order_id,
         count(*)::int AS revenue_entry_count,
         coalesce(sum(r.amount) FILTER (WHERE r.kind='CHARGE'),0)::numeric(18,2) AS revenue_charges,
         coalesce(sum(r.amount) FILTER (WHERE r.kind='REFUND'),0)::numeric(18,2) AS revenue_refunds
  FROM trust_revenue_ledger r GROUP BY r.order_id
),
truth_rollup AS (
  SELECT st.order_id,
         count(*) FILTER (WHERE st.truth_status<>'OK')::int AS seller_truth_findings,
         array_remove(array_agg(DISTINCT st.truth_status),NULL) AS seller_truth_statuses
  FROM trust_seller_settlement_truth st GROUP BY st.order_id
)
SELECT
  o.id AS order_id,
  o.customer_id,
  o.status AS order_status,
  o.subtotal,
  o.discount,
  o.shipping,
  o.total,
  o.currency,
  o.payment_method,
  o.created_at,
  o.updated_at,
  coalesce(pr.payment_count,0) AS payment_count,
  coalesce(pr.captured_amount,0)::numeric(18,2) AS captured_amount,
  coalesce(sr.seller_order_count,0) AS seller_order_count,
  coalesce(sr.seller_orders_terminal,0) AS seller_orders_terminal,
  coalesce(sr.seller_order_total,0)::numeric(18,2) AS seller_order_total,
  coalesce(fr.fulfillment_count,0) AS fulfillment_count,
  coalesce(fr.fulfillment_delivered,0) AS fulfillment_delivered,
  coalesce(fr.fulfillment_exceptions,0) AS fulfillment_exceptions,
  coalesce(se.settlement_count,0) AS settlement_count,
  coalesce(se.seller_net,0)::numeric(18,2) AS seller_net,
  coalesce(se.platform_fee,0)::numeric(18,2) AS platform_fee,
  coalesce(se.payment_fee,0)::numeric(18,2) AS payment_fee,
  coalesce(se.fulfillment_fee,0)::numeric(18,2) AS fulfillment_fee,
  coalesce(se.return_fee,0)::numeric(18,2) AS return_fee,
  coalesce(rr.revenue_entry_count,0) AS revenue_entry_count,
  coalesce(rr.revenue_charges,0)::numeric(18,2) AS revenue_charges,
  coalesce(rr.revenue_refunds,0)::numeric(18,2) AS revenue_refunds,
  coalesce(tr.seller_truth_findings,0) AS seller_truth_findings,
  coalesce(tr.seller_truth_statuses,ARRAY[]::text[]) AS seller_truth_statuses,
  CASE
    WHEN o.total IS NULL THEN 'ORDER_INVALID'
    WHEN coalesce(sr.seller_order_count,0)=0 THEN 'SELLER_SPLIT_MISSING'
    WHEN abs(o.total - coalesce(sr.seller_order_total,0)) > 0.01 THEN 'SELLER_SPLIT_TOTAL_MISMATCH'
    WHEN coalesce(tr.seller_truth_findings,0)>0 THEN 'SELLER_FINANCIAL_FINDINGS'
    WHEN coalesce(pr.captured_amount,0)>0 AND coalesce(fr.fulfillment_count,0)=0 THEN 'CAPTURED_WITHOUT_FULFILLMENT'
    WHEN coalesce(fr.fulfillment_exceptions,0)>0 THEN 'FULFILLMENT_EXCEPTION'
    ELSE 'OK'
  END AS command_status
FROM trust_orders o
LEFT JOIN payment_rollup pr ON pr.order_id=o.id
LEFT JOIN seller_rollup sr ON sr.order_id=o.id
LEFT JOIN fulfillment_rollup fr ON fr.order_id=o.id
LEFT JOIN settlement_rollup se ON se.order_id=o.id
LEFT JOIN revenue_rollup rr ON rr.order_id=o.id
LEFT JOIN truth_rollup tr ON tr.order_id=o.id;
