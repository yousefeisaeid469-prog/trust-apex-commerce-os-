-- V395 — Commerce Journey Integrity
-- Read-optimized integrity surface for the canonical payment -> execution -> fulfillment
-- -> delivery -> settlement journey. This does not manufacture state or repair rows;
-- it exposes violations that must be zero in a healthy production database.
CREATE INDEX IF NOT EXISTS trust_payments_captured_order_idx
  ON trust_payments(order_id, updated_at DESC)
  WHERE status='captured';

CREATE INDEX IF NOT EXISTS trust_execution_runs_delivery_integrity_idx
  ON trust_commerce_execution_runs(status, fulfillment_order_count, delivered_fulfillment_order_count, updated_at DESC);

CREATE INDEX IF NOT EXISTS trust_marketplace_fulfillment_delivery_integrity_idx
  ON trust_marketplace_fulfillment_orders(order_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS trust_revenue_ledger_order_integrity_idx
  ON trust_revenue_ledger(order_id, created_at DESC);

CREATE OR REPLACE VIEW trust_commerce_journey_integrity AS
WITH captured_without_execution AS (
  SELECT p.order_id, p.id AS payment_id, p.updated_at
  FROM trust_payments p
  LEFT JOIN trust_commerce_execution_runs r ON r.order_id=p.order_id
  WHERE p.status='captured' AND r.id IS NULL
),
delivery_count_mismatch AS (
  SELECT r.order_id, r.id AS execution_run_id,
         r.fulfillment_order_count, r.delivered_fulfillment_order_count
  FROM trust_commerce_execution_runs r
  WHERE r.delivered_fulfillment_order_count > r.fulfillment_order_count
),
delivered_not_backed_by_fulfillment AS (
  SELECT r.order_id, r.id AS execution_run_id
  FROM trust_commerce_execution_runs r
  WHERE r.status IN ('DELIVERED','SETTLEMENT_RELEASED','COMPLETED')
    AND (
      r.fulfillment_order_count = 0
      OR r.delivered_fulfillment_order_count < r.fulfillment_order_count
    )
),
settlement_without_delivery AS (
  SELECT r.order_id, r.id AS execution_run_id
  FROM trust_commerce_execution_runs r
  WHERE r.status='SETTLEMENT_RELEASED'
    AND r.delivered_fulfillment_order_count < r.fulfillment_order_count
),
completed_without_settlement AS (
  SELECT r.order_id, r.id AS execution_run_id
  FROM trust_commerce_execution_runs r
  WHERE r.status='COMPLETED'
    AND r.settlement_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM trust_revenue_ledger rl
      WHERE rl.order_id=r.order_id
    )
),
refunded_without_refund_record AS (
  SELECT o.id AS order_id
  FROM trust_orders o
  WHERE o.status='refunded'
    AND NOT EXISTS (
      SELECT 1
      FROM trust_payments p
      JOIN trust_refunds rf ON rf.payment_id=p.id
      WHERE p.order_id=o.id AND rf.status='succeeded'
    )
)
SELECT 'CAPTURED_WITHOUT_EXECUTION'::text AS violation, order_id, payment_id AS reference_id
FROM captured_without_execution
UNION ALL
SELECT 'DELIVERY_COUNT_MISMATCH', order_id, execution_run_id FROM delivery_count_mismatch
UNION ALL
SELECT 'DELIVERED_WITHOUT_FULFILLMENT', order_id, execution_run_id FROM delivered_not_backed_by_fulfillment
UNION ALL
SELECT 'SETTLEMENT_WITHOUT_DELIVERY', order_id, execution_run_id FROM settlement_without_delivery
UNION ALL
SELECT 'COMPLETED_WITHOUT_SETTLEMENT', order_id, execution_run_id FROM completed_without_settlement
UNION ALL
SELECT 'REFUNDED_WITHOUT_SUCCESSFUL_REFUND', order_id, NULL::uuid FROM refunded_without_refund_record;
