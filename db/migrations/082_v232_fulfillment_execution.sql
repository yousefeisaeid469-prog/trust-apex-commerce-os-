-- V232 — durable fulfillment execution guardrails.
-- The shipment state machine is enforced in application transactions; these indexes
-- make active-shipment lookup and customer shipment access deterministic at scale.
CREATE INDEX IF NOT EXISTS idx_trust_shipments_order_status ON trust_shipments(order_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_shipments_updated ON trust_shipments(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_shipment_events_occurred ON trust_shipment_tracking_events(shipment_id,occurred_at DESC);
