-- V264: durable, append-only promotion governance for reality evidence.
-- No promotion is implied by this schema; every state transition is an explicit event.
CREATE TABLE IF NOT EXISTS trust_reality_promotion_decisions (
  decision_id TEXT PRIMARY KEY,
  capability_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('PENDING_EXPLICIT_REVIEW','APPROVED','REJECTED','PROMOTED','REVOKED')),
  attestation_root TEXT NOT NULL CHECK (attestation_root ~ '^[a-f0-9]{64}$'),
  evidence_leaf TEXT NOT NULL CHECK (evidence_leaf ~ '^[a-f0-9]{64}$'),
  baseline_evidence_digest TEXT NOT NULL CHECK (baseline_evidence_digest ~ '^[a-f0-9]{64}$'),
  decision_hash TEXT NOT NULL CHECK (decision_hash ~ '^[a-f0-9]{64}$'),
  reviewer_id TEXT,
  rationale TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trust_reality_promotion_decisions_capability_v264
  ON trust_reality_promotion_decisions(capability_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_reality_promotion_decisions_state_v264
  ON trust_reality_promotion_decisions(state, updated_at DESC);

CREATE TABLE IF NOT EXISTS trust_reality_promotion_events (
  event_id BIGSERIAL PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES trust_reality_promotion_decisions(decision_id),
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  rationale TEXT NOT NULL,
  attestation_root TEXT NOT NULL CHECK (attestation_root ~ '^[a-f0-9]{64}$'),
  evidence_leaf TEXT NOT NULL CHECK (evidence_leaf ~ '^[a-f0-9]{64}$'),
  previous_event_hash TEXT,
  event_hash TEXT NOT NULL CHECK (event_hash ~ '^[a-f0-9]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (from_state <> to_state)
);

CREATE INDEX IF NOT EXISTS idx_trust_reality_promotion_events_decision_v264
  ON trust_reality_promotion_events(decision_id, event_id);

-- Prevent a decision from having two competing current rows while preserving event history.
CREATE UNIQUE INDEX IF NOT EXISTS uq_trust_reality_promotion_decisions_capability_pending_v264
  ON trust_reality_promotion_decisions(capability_id)
  WHERE state = 'PENDING_EXPLICIT_REVIEW';
