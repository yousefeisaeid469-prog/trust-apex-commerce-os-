-- V265: cryptographic authorization for reality-promotion state transitions.
-- Private signing keys are never stored in TRUST. Only public verification keys are durable.
CREATE TABLE IF NOT EXISTS trust_reality_promotion_signing_keys (
  key_id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  algorithm TEXT NOT NULL CHECK (algorithm IN ('ed25519')),
  public_key_pem TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','REVOKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trust_reality_promotion_signing_keys_actor_v265
  ON trust_reality_promotion_signing_keys(actor_id, status);

CREATE TABLE IF NOT EXISTS trust_reality_promotion_authorizations (
  authorization_id BIGSERIAL PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES trust_reality_promotion_decisions(decision_id),
  key_id TEXT NOT NULL REFERENCES trust_reality_promotion_signing_keys(key_id),
  actor_id TEXT NOT NULL,
  algorithm TEXT NOT NULL CHECK (algorithm IN ('ed25519')),
  payload_hash TEXT NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'),
  signature_base64 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_trust_reality_promotion_authorization_payload_v265
  ON trust_reality_promotion_authorizations(decision_id, payload_hash);
CREATE INDEX IF NOT EXISTS idx_trust_reality_promotion_authorizations_decision_v265
  ON trust_reality_promotion_authorizations(decision_id, authorization_id DESC);

ALTER TABLE trust_reality_promotion_events
  ADD COLUMN IF NOT EXISTS authorization_id BIGINT REFERENCES trust_reality_promotion_authorizations(authorization_id);

CREATE INDEX IF NOT EXISTS idx_trust_reality_promotion_events_authorization_v265
  ON trust_reality_promotion_events(authorization_id);
