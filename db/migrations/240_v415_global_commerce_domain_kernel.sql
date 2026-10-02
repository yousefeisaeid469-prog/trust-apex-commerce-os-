-- V415 — Global Commerce Domain Kernel
-- One operational read model for the customer journey across quote, order,
-- payment, inventory, fulfillment, settlement and runtime execution.
-- This is a truth projection over existing authorities; it does not create
-- another stock/order/payment authority.

CREATE OR REPLACE VIEW trust_commerce_domain_snapshot AS
WITH latest_payment AS (
  SELECT DISTINCT ON (p.order_id)
    p.order_id, p.id AS payment_id, p.status AS payment_status,
    p.amount AS payment_amount, p.currency AS payment_currency,
    p.provider, p.provider_reference, p.updated_at AS payment_updated_at
  FROM trust_payments p
  ORDER BY p.order_id, p.created_at DESC, p.id DESC
),
latest_execution AS (
  SELECT DISTINCT ON (e.order_id)
    e.order_id, e.id AS execution_id, e.status AS execution_status,
    e.fulfillment_order_count, e.delivered_fulfillment_order_count,
    e.settlement_id, e.last_error_code AS execution_error,
    e.updated_at AS execution_updated_at
  FROM trust_commerce_execution_runs e
  ORDER BY e.order_id, e.created_at DESC, e.id DESC
),
latest_runtime AS (
  SELECT DISTINCT ON (r.operation_key)
    r.operation_key AS order_id, r.id AS runtime_operation_id,
    r.status AS runtime_status, r.attempt_count AS runtime_attempt_count,
    r.last_error_code AS runtime_error, r.heartbeat_at,
    r.lease_expires_at, r.updated_at AS runtime_updated_at
  FROM trust_runtime_operations r
  WHERE r.operation_type='commerce.order'
  ORDER BY r.operation_key, r.updated_at DESC, r.id DESC
),
latest_quote AS (
  SELECT DISTINCT ON (q.customer_id)
    q.customer_id, q.id AS quote_id, q.expires_at AS quote_expires_at,
    q.consumed_at AS quote_consumed_at, q.pricing_version,
    q.settlement_currency AS quote_currency,
    q.created_at AS quote_created_at
  FROM trust_checkout_quotes q
  WHERE q.customer_id IS NOT NULL
  ORDER BY q.customer_id, q.created_at DESC, q.id DESC
),
cart_state AS (
  SELECT c.customer_id, c.id AS cart_id, c.updated_at AS cart_updated_at,
         count(ci.product_id)::int AS cart_line_count,
         coalesce(sum(ci.quantity),0)::int AS cart_unit_count
  FROM trust_carts c
  LEFT JOIN trust_cart_items ci ON ci.cart_id=c.id
  GROUP BY c.customer_id,c.id,c.updated_at
),
latest_order AS (
  SELECT DISTINCT ON (o.customer_id)
    o.customer_id, o.id AS order_id, o.status AS order_status,
    o.total AS order_total, o.currency AS order_currency,
    o.payment_method, o.created_at AS order_created_at, o.updated_at AS order_updated_at
  FROM trust_orders o
  ORDER BY o.customer_id, o.created_at DESC, o.id DESC
)
SELECT
  u.id AS customer_id,
  c.cart_id, c.cart_line_count, c.cart_unit_count, c.cart_updated_at,
  q.quote_id, q.quote_expires_at, q.quote_consumed_at, q.pricing_version,
  q.quote_currency, q.quote_created_at,
  o.order_id, o.order_status, o.order_total, o.order_currency,
  o.payment_method, o.order_created_at, o.order_updated_at,
  p.payment_id, p.payment_status, p.payment_amount, p.payment_currency,
  p.provider, p.provider_reference, p.payment_updated_at,
  e.execution_id, e.execution_status, e.fulfillment_order_count,
  e.delivered_fulfillment_order_count, e.settlement_id, e.execution_error,
  e.execution_updated_at,
  r.runtime_operation_id, r.runtime_status, r.runtime_attempt_count,
  r.runtime_error, r.heartbeat_at, r.lease_expires_at, r.runtime_updated_at,
  CASE
    WHEN o.order_id IS NULL AND q.quote_id IS NULL AND c.cart_id IS NULL THEN 'NO_ACTIVE_COMMERCE'
    WHEN o.order_id IS NULL AND q.quote_id IS NOT NULL AND q.quote_expires_at > now() THEN 'QUOTE_READY'
    WHEN o.order_id IS NULL AND q.quote_id IS NOT NULL THEN 'QUOTE_EXPIRED'
    WHEN p.payment_status IN ('failed','cancelled') THEN 'PAYMENT_FAILED'
    WHEN r.runtime_status IN ('FAILED','DEAD') THEN 'RUNTIME_FAILED'
    WHEN p.payment_status IN ('pending','requires_action','authorized') THEN 'PAYMENT_WAITING'
    WHEN p.payment_status='captured' AND e.execution_id IS NULL THEN 'CAPTURED_PAYMENT_NO_EXECUTION'
    WHEN e.execution_status='BLOCKED' THEN 'FULFILLMENT_BLOCKED'
    WHEN e.execution_status IN ('CAPTURED','FULFILLMENT_PLANNED','IN_FULFILLMENT') THEN 'FULFILLMENT_IN_PROGRESS'
    WHEN e.execution_status='DELIVERED' AND e.settlement_id IS NULL THEN 'SETTLEMENT_PENDING'
    WHEN e.execution_status='SETTLEMENT_RELEASED' THEN 'COMPLETION_PENDING'
    WHEN e.execution_status='COMPLETED' THEN 'COMPLETED'
    WHEN e.execution_status='REFUNDED' THEN 'REFUNDED'
    ELSE 'ORDER_ACTIVE'
  END AS commerce_health
FROM trust_users u
LEFT JOIN cart_state c ON c.customer_id=u.id
LEFT JOIN latest_quote q ON q.customer_id=u.id
LEFT JOIN latest_order o ON o.customer_id=u.id
LEFT JOIN latest_payment p ON p.order_id=o.order_id
LEFT JOIN latest_execution e ON e.order_id=o.order_id
LEFT JOIN latest_runtime r ON r.order_id=o.order_id;

CREATE INDEX IF NOT EXISTS trust_runtime_operations_order_key_idx
  ON trust_runtime_operations(operation_type,operation_key,updated_at DESC);

COMMENT ON VIEW trust_commerce_domain_snapshot IS
  'V415 canonical customer commerce read model. Orders, payments, execution, runtime, quotes and carts remain authoritative in their existing tables.';
