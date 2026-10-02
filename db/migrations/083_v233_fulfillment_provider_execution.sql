-- V233 — provider-backed fulfillment execution and reconciliation.
ALTER TABLE trust_shipments ADD COLUMN IF NOT EXISTS provider_reference text;
CREATE INDEX IF NOT EXISTS idx_trust_shipments_provider_reference ON trust_shipments(carrier,provider_reference) WHERE provider_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS trust_shipment_provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  shipment_id uuid NOT NULL REFERENCES trust_shipments(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  tracking_number text,
  occurred_at timestamptz NOT NULL,
  payload_json jsonb NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','PROCESSING','PROCESSED','FAILED')),
  processing_attempts integer NOT NULL DEFAULT 0 CHECK(processing_attempts >= 0),
  last_error text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider,event_id)
);
CREATE INDEX IF NOT EXISTS idx_trust_shipment_provider_events_status ON trust_shipment_provider_events(status,created_at ASC);
CREATE INDEX IF NOT EXISTS idx_trust_shipment_provider_events_shipment ON trust_shipment_provider_events(shipment_id,occurred_at DESC);

CREATE TABLE IF NOT EXISTS trust_shipment_reconciliation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  shipment_id uuid NOT NULL REFERENCES trust_shipments(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','PROCESSING','DONE','FAILED')),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider,event_id)
);
CREATE INDEX IF NOT EXISTS idx_trust_shipment_reconciliation_ready ON trust_shipment_reconciliation_jobs(status,available_at,lease_until);
CREATE INDEX IF NOT EXISTS idx_trust_shipment_reconciliation_shipment ON trust_shipment_reconciliation_jobs(shipment_id,created_at DESC);
