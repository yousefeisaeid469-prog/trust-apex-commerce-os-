-- V268: durable promotion command gateway.
-- Every cryptographically authorized transition is now bound to a unique command envelope.
-- No private signing material is stored by TRUST.
CREATE TABLE IF NOT EXISTS trust_reality_promotion_commands (
  command_id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES trust_reality_promotion_decisions(decision_id),
  command_type TEXT NOT NULL CHECK (command_type IN ('APPROVE','REJECT','PROMOTE','REVOKE')),
  actor_id TEXT NOT NULL,
  key_id TEXT NOT NULL REFERENCES trust_reality_promotion_signing_keys(key_id),
  rationale TEXT NOT NULL,
  attestation_root TEXT NOT NULL CHECK (attestation_root ~ '^[a-f0-9]{64}$'),
  evidence_leaf TEXT NOT NULL CHECK (evidence_leaf ~ '^[a-f0-9]{64}$'),
  authorization_nonce TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL,
  authorization_expires_at TIMESTAMPTZ NOT NULL,
  command_hash TEXT NOT NULL CHECK (command_hash ~ '^[a-f0-9]{64}$'),
  signature_digest TEXT NOT NULL CHECK (signature_digest ~ '^[a-f0-9]{64}$'),
  status TEXT NOT NULL CHECK (status IN ('RECEIVED','APPLIED')),
  result_event_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_trust_reality_promotion_commands_hash_v268
  ON trust_reality_promotion_commands(command_hash);
CREATE INDEX IF NOT EXISTS idx_trust_reality_promotion_commands_decision_v268
  ON trust_reality_promotion_commands(decision_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_reality_promotion_commands_status_v268
  ON trust_reality_promotion_commands(status, created_at DESC);

ALTER TABLE trust_reality_promotion_authorizations
  ADD COLUMN IF NOT EXISTS command_id TEXT REFERENCES trust_reality_promotion_commands(command_id);
ALTER TABLE trust_reality_promotion_events
  ADD COLUMN IF NOT EXISTS command_id TEXT REFERENCES trust_reality_promotion_commands(command_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_trust_reality_promotion_authorizations_command_v268
  ON trust_reality_promotion_authorizations(command_id) WHERE command_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_trust_reality_promotion_events_command_v268
  ON trust_reality_promotion_events(command_id) WHERE command_id IS NOT NULL;
