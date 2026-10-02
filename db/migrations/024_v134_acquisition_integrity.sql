-- TRUST V134 — acquisition-grade financial, inventory and operational invariants.
-- NOTE (V154 fix): trust_idempotency_keys, trust_inventory_reservations, and
-- trust_payment_events did not exist yet at this point in the migration
-- sequence. Their columns, check constraints, and indexes below are now
-- part of each table's own CREATE TABLE in 044_v154_missing_transactional_core.sql.
-- Fixed pre-deployment; no live database ever ran this migration set.

CREATE INDEX IF NOT EXISTS trust_refunds_status_idx ON trust_refunds(payment_id,status,updated_at DESC);

CREATE TABLE IF NOT EXISTS trust_release_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_version text NOT NULL,
  check_name text NOT NULL,
  status text NOT NULL CHECK(status IN ('PASS','WARN','FAIL','NOT_RUN')),
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  observed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(release_version,check_name)
);
CREATE INDEX IF NOT EXISTS trust_release_evidence_version_idx ON trust_release_evidence(release_version,observed_at DESC);

CREATE TABLE IF NOT EXISTS trust_incident_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_key text NOT NULL,
  severity text NOT NULL CHECK(severity IN ('SEV0','SEV1','SEV2','SEV3','SEV4')),
  state text NOT NULL CHECK(state IN ('open','acknowledged','mitigated','resolved')),
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS trust_incident_events_state_idx ON trust_incident_events(state,occurred_at DESC);
