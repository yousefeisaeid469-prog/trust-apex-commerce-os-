-- V274 — Intelligent Marketplace Checkout
-- Durable binding of the selected offer, fulfillment location and split-shipment plan.

ALTER TABLE trust_inventory_reservations
  ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES trust_marketplace_offers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES trust_fulfillment_locations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_trust_inventory_reservations_offer_location
  ON trust_inventory_reservations(offer_id, location_id, status);

CREATE TABLE IF NOT EXISTS trust_order_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE RESTRICT,
  location_id uuid REFERENCES trust_fulfillment_locations(id) ON DELETE SET NULL,
  destination_region text NOT NULL,
  min_days integer NOT NULL CHECK (min_days >= 0),
  max_days integer NOT NULL CHECK (max_days >= min_days),
  shipping_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  fulfillment_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (fulfillment_cost >= 0),
  source text NOT NULL CHECK (source IN ('NETWORK','OFFER_FALLBACK')),
  offer_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_order_shipments_order ON trust_order_shipments(order_id, created_at);
