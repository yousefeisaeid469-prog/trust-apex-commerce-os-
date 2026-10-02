-- TRUST V118: AI Shopping Concierge + Visual Intelligence
CREATE TABLE IF NOT EXISTS trust_discovery_missions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  query TEXT NOT NULL,
  budget NUMERIC(14,2),
  currency TEXT NOT NULL DEFAULT 'EGP',
  deadline TIMESTAMPTZ,
  priorities JSONB NOT NULL DEFAULT '[]'::jsonb,
  consented BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trust_discovery_missions_session ON trust_discovery_missions(session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_discovery_events (
  id BIGSERIAL PRIMARY KEY,
  mission_id BIGINT REFERENCES trust_discovery_missions(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  consented BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trust_discovery_events_type ON trust_discovery_events(event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_vision_searches (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  provider TEXT,
  status TEXT NOT NULL,
  query TEXT,
  image_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
