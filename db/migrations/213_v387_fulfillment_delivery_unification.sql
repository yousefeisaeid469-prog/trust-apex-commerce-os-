-- V387 — Fulfillment / Shipment / Delivery Unification
-- Bind each durable marketplace fulfillment order to exactly one customer-facing shipment.
-- This preserves legacy order-level shipments while making multi-seller fulfillment first-class.

ALTER TABLE trust_shipments
  ADD COLUMN IF NOT EXISTS fulfillment_order_id uuid REFERENCES trust_marketplace_fulfillment_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS trust_shipments_fulfillment_order_uq
  ON trust_shipments(fulfillment_order_id)
  WHERE fulfillment_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS trust_shipments_idempotency_key_uq
  ON trust_shipments(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS trust_shipments_order_status_idx
  ON trust_shipments(order_id,status,created_at DESC);

COMMENT ON COLUMN trust_shipments.fulfillment_order_id IS
  'V387: exact marketplace fulfillment order represented by this customer-facing shipment; nullable for legacy order-level shipments.';
COMMENT ON COLUMN trust_shipments.idempotency_key IS
  'V387: durable shipment creation idempotency key.';
