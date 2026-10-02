-- V117 Discovery Revolution: durable contracts for user discovery and transparent ranking.
CREATE TABLE IF NOT EXISTS trust_discovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT NOT NULL,
  query TEXT NOT NULL,
  intent TEXT NOT NULL,
  budget NUMERIC(12,2),
  deadline TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_discovery_sessions_key_created ON trust_discovery_sessions(session_key, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_discovery_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES trust_discovery_sessions(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view','save','compare','dismiss','add_to_cart')),
  reason_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_discovery_feedback_product ON trust_discovery_feedback(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_discovery_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','running','paused','ended')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
