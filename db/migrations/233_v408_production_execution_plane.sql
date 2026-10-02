-- V408 — Global Production Execution Plane.
-- Extends V407 runtime operations into the real commerce lifecycle.
ALTER TABLE trust_runtime_operations
  ADD COLUMN IF NOT EXISTS heartbeat_at timestamptz,
  ADD COLUMN IF NOT EXISTS lease_owner text,
  ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz;

CREATE INDEX IF NOT EXISTS trust_runtime_operations_recovery_idx
  ON trust_runtime_operations(status,next_attempt_at,lease_expires_at,updated_at)
  WHERE status IN ('WAITING','FAILED','DEAD');

CREATE OR REPLACE VIEW trust_production_execution_snapshot AS
SELECT
  o.id AS order_id,
  o.status AS order_status,
  o.payment_method,
  o.total,
  o.currency,
  p.id AS payment_id,
  p.status AS payment_status,
  p.amount AS payment_amount,
  e.id AS execution_id,
  e.status AS execution_status,
  e.fulfillment_order_count,
  e.delivered_fulfillment_order_count,
  e.settlement_id,
  r.id AS runtime_operation_id,
  r.status AS runtime_status,
  r.attempt_count AS runtime_attempt_count,
  r.last_error_code AS runtime_error_code,
  r.heartbeat_at AS runtime_heartbeat_at,
  r.lease_expires_at AS runtime_lease_expires_at,
  CASE
    WHEN r.id IS NULL THEN 'NO_RUNTIME_OPERATION'
    WHEN r.status IN ('FAILED','DEAD') THEN 'RUNTIME_FAILED'
    WHEN p.status IN ('failed','cancelled') THEN 'PAYMENT_FAILED'
    WHEN p.status IN ('pending','requires_action','authorized') THEN 'PAYMENT_WAITING'
    WHEN p.status = 'captured' AND e.id IS NULL THEN 'CAPTURED_PAYMENT_NO_EXECUTION'
    WHEN e.status = 'BLOCKED' THEN 'FULFILLMENT_BLOCKED'
    WHEN e.status IN ('CAPTURED','FULFILLMENT_PLANNED','IN_FULFILLMENT') THEN 'DELIVERY_IN_PROGRESS'
    WHEN e.status = 'DELIVERED' AND e.settlement_id IS NULL THEN 'SETTLEMENT_PENDING'
    WHEN e.status = 'SETTLEMENT_RELEASED' THEN 'COMPLETION_PENDING'
    WHEN e.status = 'COMPLETED' THEN 'COMPLETED'
    WHEN e.status = 'REFUNDED' THEN 'REFUNDED'
    ELSE 'IN_SYNC'
  END AS execution_health
FROM trust_orders o
LEFT JOIN LATERAL (
  SELECT id,status,amount FROM trust_payments WHERE order_id=o.id ORDER BY created_at DESC,id DESC LIMIT 1
) p ON true
LEFT JOIN LATERAL (
  SELECT * FROM trust_commerce_execution_runs WHERE order_id=o.id ORDER BY created_at DESC,id DESC LIMIT 1
) e ON true
LEFT JOIN trust_runtime_operations r
  ON r.operation_type='commerce.order' AND r.operation_key=o.id::text;

COMMENT ON VIEW trust_production_execution_snapshot IS
  'V408 cross-domain execution truth joining order, payment, fulfillment execution, settlement and V407 runtime operation state.';
