-- TRUST V308 — Global Logistics Control Tower
-- Durable risk snapshots and operator-grade logistics visibility.
CREATE TABLE IF NOT EXISTS trust_global_logistics_control_tower_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  shipment_id uuid NOT NULL REFERENCES trust_shipments(id) ON DELETE CASCADE,
  carrier_code text NOT NULL,
  tracking_number text,
  shipment_status text NOT NULL,
  eta_at timestamptz,
  last_event_at timestamptz,
  risk_band text NOT NULL CHECK(risk_band IN ('GREEN','AMBER','RED')),
  risk_score integer NOT NULL CHECK(risk_score >= 0 AND risk_score <= 100),
  risk_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_action text NOT NULL,
  execution_status text,
  execution_attempts integer NOT NULL DEFAULT 0,
  open_exceptions integer NOT NULL DEFAULT 0,
  critical_exceptions integer NOT NULL DEFAULT 0,
  snapshot_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_global_logistics_tower_order ON trust_global_logistics_control_tower_snapshots(order_id,snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_logistics_tower_risk ON trust_global_logistics_control_tower_snapshots(risk_band,snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_logistics_tower_shipment ON trust_global_logistics_control_tower_snapshots(shipment_id,snapshot_at DESC);
