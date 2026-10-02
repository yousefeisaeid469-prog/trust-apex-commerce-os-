-- V277 — durable shopping missions and explainable smart bundles.
CREATE TABLE IF NOT EXISTS trust_marketplace_shopping_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_hash text NOT NULL,
  mission_text text NOT NULL DEFAULT '',
  category text,
  budget numeric(18,2) CHECK (budget IS NULL OR budget >= 0),
  region text NOT NULL DEFAULT 'GLOBAL',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','COMPLETED','CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_missions_session ON trust_marketplace_shopping_missions(session_hash,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_missions_category ON trust_marketplace_shopping_missions(category,status);

CREATE TABLE IF NOT EXISTS trust_marketplace_bundle_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text,
  discount_bps integer NOT NULL DEFAULT 0 CHECK (discount_bps BETWEEN 0 AND 5000),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_marketplace_bundle_items (
  bundle_id uuid NOT NULL REFERENCES trust_marketplace_bundle_templates(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE CASCADE,
  qty integer NOT NULL DEFAULT 1 CHECK (qty > 0),
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  PRIMARY KEY(bundle_id,product_id)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_bundle_items_product ON trust_marketplace_bundle_items(product_id);

CREATE TABLE IF NOT EXISTS trust_marketplace_mission_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES trust_marketplace_shopping_missions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES trust_marketplace_offers(id) ON DELETE SET NULL,
  score numeric(12,6) NOT NULL CHECK (score >= 0),
  reason_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(mission_id,product_id)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_mission_recommendations_mission ON trust_marketplace_mission_recommendations(mission_id,score DESC);
