-- TRUST V307 — Global Logistics Tracking Reconciliation
-- Durable carrier-event ingestion, deduplication, ordering, and shipment reconciliation.
CREATE TABLE IF NOT EXISTS trust_global_logistics_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_code text NOT NULL REFERENCES trust_global_carrier_registry(carrier_code) ON DELETE RESTRICT,
  external_event_id text NOT NULL,
  shipment_id uuid REFERENCES trust_shipments(id) ON DELETE RESTRICT,
  tracking_number text NOT NULL,
  status text NOT NULL CHECK(status IN ('PLANNED','LABEL_CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','EXCEPTION','CANCELLED')),
  exception_code text,
  occurred_at timestamptz NOT NULL,
  location text,
  description text,
  eta_at timestamptz,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  reconciliation text NOT NULL CHECK(reconciliation IN ('APPLIED','DUPLICATE','STALE','UNMATCHED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(carrier_code,external_event_id)
);
CREATE INDEX IF NOT EXISTS idx_global_logistics_tracking_shipment ON trust_global_logistics_tracking_events(shipment_id,occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_logistics_tracking_lookup ON trust_global_logistics_tracking_events(carrier_code,tracking_number,occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_logistics_tracking_reconciliation ON trust_global_logistics_tracking_events(reconciliation,created_at DESC);

ALTER TABLE trust_shipments ADD COLUMN IF NOT EXISTS last_carrier_event_at timestamptz;
ALTER TABLE trust_shipments ADD COLUMN IF NOT EXISTS carrier_event_version bigint NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_shipments_carrier_tracking ON trust_shipments(carrier,tracking_number);
