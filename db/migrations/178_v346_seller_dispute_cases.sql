-- V346 — seller-scoped customer disputes/claims with evidence and financial holds.
CREATE TABLE IF NOT EXISTS trust_seller_dispute_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  seller_order_id uuid NOT NULL REFERENCES trust_seller_orders(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES trust_order_items(id) ON DELETE SET NULL,
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK(kind IN ('ITEM_NOT_RECEIVED','WRONG_ITEM','DAMAGED','NOT_AS_DESCRIBED','REFUND_MISSING','OTHER')),
  status text NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','SELLER_RESPONSE_REQUIRED','UNDER_REVIEW','RESOLVED_CUSTOMER','RESOLVED_SELLER','CANCELLED')),
  requested_amount numeric(18,2) NOT NULL CHECK(requested_amount > 0),
  held_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(held_amount >= 0),
  currency char(3) NOT NULL,
  customer_message text,
  seller_response text,
  resolution_note text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CHECK(held_amount <= requested_amount)
);
CREATE INDEX IF NOT EXISTS trust_seller_dispute_cases_customer_idx
  ON trust_seller_dispute_cases(customer_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_seller_dispute_cases_merchant_idx
  ON trust_seller_dispute_cases(merchant_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_seller_dispute_cases_seller_order_idx
  ON trust_seller_dispute_cases(seller_order_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_seller_dispute_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES trust_seller_dispute_cases(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES trust_users(id) ON DELETE RESTRICT,
  actor_type text NOT NULL CHECK(actor_type IN ('CUSTOMER','SELLER','OPERATIONS')),
  evidence_type text NOT NULL CHECK(evidence_type IN ('MESSAGE','IMAGE','DOCUMENT','TRACKING','REFUND_RECEIPT','OTHER')),
  content_uri text,
  content_text text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(content_uri IS NOT NULL OR content_text IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS trust_seller_dispute_evidence_case_idx
  ON trust_seller_dispute_evidence(case_id,created_at ASC);

CREATE TABLE IF NOT EXISTS trust_seller_dispute_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES trust_seller_dispute_cases(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  actor_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  event_key text NOT NULL UNIQUE,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_seller_dispute_events_case_idx
  ON trust_seller_dispute_events(case_id,created_at ASC);

CREATE UNIQUE INDEX IF NOT EXISTS trust_seller_dispute_open_item_idx
  ON trust_seller_dispute_cases(order_item_id)
  WHERE order_item_id IS NOT NULL AND status IN ('OPEN','SELLER_RESPONSE_REQUIRED','UNDER_REVIEW');
