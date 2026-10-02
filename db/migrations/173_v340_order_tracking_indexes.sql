-- V340 — order tracking / fulfillment detail read paths.
-- Read-heavy customer and merchant surfaces get targeted indexes; no fake state is introduced.
CREATE INDEX IF NOT EXISTS idx_trust_order_status_history_order_created
  ON trust_order_status_history(order_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_trust_shipments_order_created
  ON trust_shipments(order_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_trust_shipment_events_shipment_occurred
  ON trust_shipment_tracking_events(shipment_id, occurred_at ASC);
CREATE INDEX IF NOT EXISTS idx_trust_fulfillment_events_orderfulfillment_created
  ON trust_marketplace_fulfillment_events(fulfillment_order_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_trust_fulfillment_orders_order_created
  ON trust_marketplace_fulfillment_orders(order_id, created_at ASC);
