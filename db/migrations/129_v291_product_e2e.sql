-- V291 Product E2E: durable journey evidence and cart-checkout contract.
CREATE TABLE IF NOT EXISTS trust_product_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  merchant_id uuid REFERENCES trust_merchant_profiles(id) ON DELETE SET NULL,
  order_id uuid REFERENCES trust_orders(id) ON DELETE SET NULL,
  journey_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'STARTED' CHECK (status IN ('STARTED','CHECKOUT_COMMITTED','PAYMENT_PENDING','FULFILLMENT_STARTED','DELIVERED','COMPLETED','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_product_journey_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES trust_product_journeys(id) ON DELETE CASCADE,
  checkpoint text NOT NULL,
  reference_id uuid,
  observed_at timestamptz NOT NULL DEFAULT now(),
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(journey_id,checkpoint)
);
CREATE INDEX IF NOT EXISTS idx_product_journey_status ON trust_product_journeys(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_journey_checkpoint ON trust_product_journey_checkpoints(checkpoint,observed_at DESC);
