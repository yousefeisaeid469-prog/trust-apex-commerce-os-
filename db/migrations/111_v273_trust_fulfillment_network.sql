-- V273 — Trust Fulfillment Network
-- Removes the accidental one-offer-per-product restriction and makes delivery a durable network decision.
ALTER TABLE trust_marketplace_offers DROP CONSTRAINT IF EXISTS trust_marketplace_offers_product_id_key;

CREATE TABLE IF NOT EXISTS trust_fulfillment_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  region text NOT NULL,
  capacity_units integer NOT NULL DEFAULT 0 CHECK (capacity_units >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_fulfillment_locations_region ON trust_fulfillment_locations(region, active);

CREATE TABLE IF NOT EXISTS trust_fulfillment_inventory (
  location_id uuid NOT NULL REFERENCES trust_fulfillment_locations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES trust_marketplace_offers(id) ON DELETE CASCADE,
  available_units integer NOT NULL DEFAULT 0 CHECK (available_units >= 0),
  reserved_units integer NOT NULL DEFAULT 0 CHECK (reserved_units >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(location_id, product_id, offer_id)
);
CREATE INDEX IF NOT EXISTS idx_trust_fulfillment_inventory_product ON trust_fulfillment_inventory(product_id, available_units DESC);

CREATE TABLE IF NOT EXISTS trust_fulfillment_lanes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_region text NOT NULL,
  destination_region text NOT NULL,
  transit_min_days integer NOT NULL CHECK (transit_min_days >= 0),
  transit_max_days integer NOT NULL CHECK (transit_max_days >= transit_min_days),
  shipping_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  active boolean NOT NULL DEFAULT true,
  UNIQUE(origin_region, destination_region)
);

CREATE TABLE IF NOT EXISTS trust_fulfillment_promises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES trust_marketplace_offers(id) ON DELETE CASCADE,
  destination_region text NOT NULL,
  location_id uuid NOT NULL REFERENCES trust_fulfillment_locations(id) ON DELETE CASCADE,
  min_days integer NOT NULL CHECK (min_days >= 0),
  max_days integer NOT NULL CHECK (max_days >= min_days),
  shipping_cost numeric(12,2) NOT NULL CHECK (shipping_cost >= 0),
  fulfillment_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (fulfillment_cost >= 0),
  score numeric(10,6) NOT NULL DEFAULT 0,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(offer_id, destination_region, location_id)
);
CREATE INDEX IF NOT EXISTS idx_trust_fulfillment_promises_offer ON trust_fulfillment_promises(offer_id, destination_region, max_days);
