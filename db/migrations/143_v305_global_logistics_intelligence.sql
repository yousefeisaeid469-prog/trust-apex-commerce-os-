-- TRUST V305 — Global Logistics Intelligence
CREATE TABLE IF NOT EXISTS trust_global_logistics_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
  shipment_id uuid REFERENCES trust_shipments(id) ON DELETE RESTRICT,
  destination_country text NOT NULL,
  currency text NOT NULL,
  requested_mode text NOT NULL CHECK (requested_mode IN ('STANDARD','EXPRESS','PICKUP')),
  priority text NOT NULL CHECK (priority IN ('BALANCED','COST','SPEED','RELIABILITY')),
  selected_carrier text NOT NULL REFERENCES trust_global_carrier_registry(carrier_code) ON DELETE RESTRICT,
  selected_service text NOT NULL,
  score numeric(12,6) NOT NULL,
  candidate_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_global_logistics_decisions_order ON trust_global_logistics_decisions(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_logistics_decisions_carrier ON trust_global_logistics_decisions(selected_carrier,created_at DESC);
