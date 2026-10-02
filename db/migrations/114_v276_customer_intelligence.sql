-- V276 — privacy-minimal organic customer intelligence.
-- Session hashes only; no raw query text, identity, or cross-site tracking.
CREATE TABLE IF NOT EXISTS trust_marketplace_preference_profiles (
  session_hash text NOT NULL,
  category text NOT NULL,
  category_count integer NOT NULL DEFAULT 0 CHECK (category_count >= 0),
  price_sum numeric(18,4) NOT NULL DEFAULT 0 CHECK (price_sum >= 0),
  view_count integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  last_view_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(session_hash, category)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_pref_recent ON trust_marketplace_preference_profiles(session_hash,last_view_at DESC);
CREATE TABLE IF NOT EXISTS trust_marketplace_preference_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_hash text NOT NULL,
  product_id uuid NOT NULL REFERENCES trust_products(id) ON DELETE CASCADE,
  category text NOT NULL,
  price numeric(18,4) NOT NULL CHECK (price >= 0),
  event_type text NOT NULL CHECK (event_type IN ('PRODUCT_VIEW')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_pref_events_session ON trust_marketplace_preference_events(session_hash,created_at DESC);
