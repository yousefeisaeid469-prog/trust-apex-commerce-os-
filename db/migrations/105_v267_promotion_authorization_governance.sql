-- V267: durable authorization governance, replay protection and separation of duties.
-- Private signing keys remain outside TRUST.
ALTER TABLE trust_reality_promotion_authorizations
  ADD COLUMN IF NOT EXISTS policy_version TEXT NOT NULL DEFAULT 'V267',
  ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_trust_reality_promotion_authorization_nonce_global_v267
  ON trust_reality_promotion_authorizations(authorization_nonce);

CREATE TABLE IF NOT EXISTS trust_reality_promotion_governance_policies (
  policy_id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  max_authorization_ttl_seconds INTEGER NOT NULL CHECK (max_authorization_ttl_seconds BETWEEN 30 AND 3600),
  require_separation_of_duties BOOLEAN NOT NULL DEFAULT TRUE,
  require_fresh_nonce BOOLEAN NOT NULL DEFAULT TRUE,
  auto_promotion BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_trust_reality_promotion_governance_active_v267
  ON trust_reality_promotion_governance_policies(active) WHERE active = TRUE;

INSERT INTO trust_reality_promotion_governance_policies
  (policy_id,version,max_authorization_ttl_seconds,require_separation_of_duties,require_fresh_nonce,auto_promotion)
VALUES ('reality-promotion-default','V267',600,TRUE,TRUE,FALSE)
ON CONFLICT (policy_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS trust_reality_promotion_governance_events (
  governance_event_id BIGSERIAL PRIMARY KEY,
  decision_id TEXT REFERENCES trust_reality_promotion_decisions(decision_id),
  authorization_id BIGINT REFERENCES trust_reality_promotion_authorizations(authorization_id),
  event_type TEXT NOT NULL CHECK (event_type IN ('AUTHORIZATION_ACCEPTED','AUTHORIZATION_REJECTED','POLICY_BLOCKED','NONCE_REPLAY_BLOCKED')),
  actor_id TEXT,
  reason TEXT NOT NULL,
  event_hash TEXT NOT NULL CHECK (event_hash ~ '^[a-f0-9]{64}$'),
  previous_event_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_reality_promotion_governance_events_decision_v267
  ON trust_reality_promotion_governance_events(decision_id, governance_event_id DESC);

CREATE TABLE IF NOT EXISTS trust_reality_promotion_key_lifecycle_events_v267 (
  lifecycle_event_id BIGSERIAL PRIMARY KEY,
  key_id TEXT NOT NULL REFERENCES trust_reality_promotion_signing_keys(key_id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  event_hash TEXT NOT NULL CHECK (event_hash ~ '^[a-f0-9]{64}$'),
  previous_event_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_reality_promotion_key_events_v267
  ON trust_reality_promotion_key_lifecycle_events_v267(key_id, lifecycle_event_id DESC);
