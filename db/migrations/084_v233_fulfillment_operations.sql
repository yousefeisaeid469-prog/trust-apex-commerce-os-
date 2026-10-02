-- V233 — fulfillment risk and exception operations.
CREATE TABLE IF NOT EXISTS trust_shipment_exception_actions (
  id text PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES trust_shipments(id) ON DELETE CASCADE,
  tracking_event_id text NOT NULL REFERENCES trust_shipment_tracking_events(id) ON DELETE CASCADE,
  action text NOT NULL CHECK(action IN ('ACKNOWLEDGE','RESOLVE','ESCALATE')),
  note text NOT NULL CHECK(length(note) BETWEEN 1 AND 2000),
  actor_id uuid NOT NULL REFERENCES trust_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_shipment_exception_actions_shipment ON trust_shipment_exception_actions(shipment_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_shipment_exception_actions_event ON trust_shipment_exception_actions(tracking_event_id,created_at DESC);
