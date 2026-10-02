-- V266: durable signing-key lifecycle and authorization freshness governance.
-- Private signing material remains external/KMS-only. TRUST stores public keys and lifecycle metadata.
ALTER TABLE trust_reality_promotion_signing_keys
  ADD COLUMN IF NOT EXISTS status_v266 TEXT,
  ADD COLUMN IF NOT EXISTS not_before TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS supersedes_key_id TEXT REFERENCES trust_reality_promotion_signing_keys(key_id),
  ADD COLUMN IF NOT EXISTS retired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lifecycle_version BIGINT NOT NULL DEFAULT 1;

UPDATE trust_reality_promotion_signing_keys SET status_v266 = status WHERE status_v266 IS NULL;
ALTER TABLE trust_reality_promotion_signing_keys
  DROP CONSTRAINT IF EXISTS trust_reality_promotion_signing_keys_status_v266_check;
ALTER TABLE trust_reality_promotion_signing_keys
  ADD CONSTRAINT trust_reality_promotion_signing_keys_status_v266_check
  CHECK (status_v266 IN ('ACTIVE','RETIRED','REVOKED','EXPIRED'));
CREATE INDEX IF NOT EXISTS idx_trust_reality_promotion_signing_keys_expiry_v266
  ON trust_reality_promotion_signing_keys(status_v266, expires_at);

CREATE TABLE IF NOT EXISTS trust_reality_promotion_key_lifecycle_events (
  lifecycle_event_id BIGSERIAL PRIMARY KEY,
  key_id TEXT NOT NULL REFERENCES trust_reality_promotion_signing_keys(key_id),
  from_status TEXT,
  to_status TEXT NOT NULL CHECK (to_status IN ('ACTIVE','RETIRED','REVOKED','EXPIRED')),
  actor_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  supersedes_key_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_reality_promotion_key_lifecycle_v266
  ON trust_reality_promotion_key_lifecycle_events(key_id, lifecycle_event_id DESC);

ALTER TABLE trust_reality_promotion_authorizations
  ADD COLUMN IF NOT EXISTS authorization_nonce TEXT,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS authorization_expires_at TIMESTAMPTZ;
UPDATE trust_reality_promotion_authorizations
  SET authorization_nonce = COALESCE(authorization_nonce, md5(authorization_id::text)),
      signed_at = COALESCE(signed_at, created_at)
  WHERE authorization_nonce IS NULL OR signed_at IS NULL;
ALTER TABLE trust_reality_promotion_authorizations
  ALTER COLUMN authorization_nonce SET NOT NULL,
  ALTER COLUMN signed_at SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_trust_reality_promotion_authorization_nonce_v266
  ON trust_reality_promotion_authorizations(decision_id, authorization_nonce);
CREATE INDEX IF NOT EXISTS idx_trust_reality_promotion_authorization_expiry_v266
  ON trust_reality_promotion_authorizations(authorization_expires_at);
