-- V350 — durable payout provider webhooks, payload integrity and replay-safe reconciliation.
CREATE TABLE IF NOT EXISTS trust_marketplace_payout_provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES trust_marketplace_payout_requests(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  provider_reference text,
  status text NOT NULL CHECK(status IN ('PROCESSING','PAID','FAILED','HELD','REVERSED')),
  amount numeric(18,2) NOT NULL CHECK(amount>0),
  currency text NOT NULL,
  failure_code text,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE(provider,provider_event_id)
);
CREATE INDEX IF NOT EXISTS trust_payout_provider_events_payout_idx
  ON trust_marketplace_payout_provider_events(payout_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_payout_provider_events_status_idx
  ON trust_marketplace_payout_provider_events(provider,status,created_at DESC);

ALTER TABLE trust_marketplace_payout_requests
  ADD COLUMN IF NOT EXISTS provider_event_id text;
CREATE INDEX IF NOT EXISTS trust_marketplace_payout_provider_event_idx
  ON trust_marketplace_payout_requests(provider,provider_event_id)
  WHERE provider_event_id IS NOT NULL;
