-- TRUST V129 — Production Integrity: durable identity, decision ledger, audit, idempotency and control state.
-- PostgreSQL 15+. This migration is intentionally additive and idempotent.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS trust_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('customer','merchant','admin','support','operations')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','suspended')),
  merchant_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_users_status ON trust_users(status);

CREATE TABLE IF NOT EXISTS trust_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_trust_sessions_user ON trust_sessions(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_sessions_active ON trust_sessions(expires_at) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS trust_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE CASCADE UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_cart_items (
  cart_id uuid NOT NULL REFERENCES trust_carts(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  quantity integer NOT NULL CHECK(quantity > 0),
  PRIMARY KEY(cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS trust_merchant_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE CASCADE UNIQUE,
  store_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  customer_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),
  title text,
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, customer_id)
);
CREATE INDEX IF NOT EXISTS idx_trust_reviews_product ON trust_reviews(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  customer_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_returns_customer ON trust_returns(customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_payment_intents (
  id text PRIMARY KEY,
  order_id text NOT NULL,
  customer_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE CASCADE,
  amount numeric(18,2) NOT NULL CHECK(amount > 0),
  currency char(3) NOT NULL DEFAULT 'EGP',
  status text NOT NULL,
  provider text NOT NULL,
  provider_reference text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_payment_intents_customer ON trust_payment_intents(customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_admin_rate_limits (
  bucket_key text PRIMARY KEY,
  count integer NOT NULL,
  reset_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_admin_control_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  mode text NOT NULL CHECK(mode IN ('normal','safe','readonly','emergency')),
  actor_email text,
  reason text,
  version bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO trust_admin_control_state(singleton, mode) VALUES(true, 'normal') ON CONFLICT(singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS trust_audit_events (
  id bigserial PRIMARY KEY, actor_id text, action text NOT NULL, resource_type text NOT NULL, resource_id text, request_id text,
  payload_hash text NOT NULL, previous_hash text, chain_hash text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_audit_resource ON trust_audit_events(resource_type, resource_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_decision_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id text NOT NULL,
  tenant_id text NOT NULL,
  actor_id text,
  event_type text NOT NULL,
  payload_hash text NOT NULL,
  previous_hash text,
  chain_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_decision_audit_decision ON trust_decision_audit(decision_id, created_at DESC);

ALTER TABLE trust_evidence_records ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'default';
ALTER TABLE trust_evidence_records ADD COLUMN IF NOT EXISTS trust_level text NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE trust_evidence_records ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE trust_evidence_records ADD COLUMN IF NOT EXISTS provider_id text;
ALTER TABLE trust_evidence_records ADD COLUMN IF NOT EXISTS provenance jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE trust_evidence_records ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE trust_evidence_records ADD COLUMN IF NOT EXISTS content_hash text;
CREATE INDEX IF NOT EXISTS idx_trust_evidence_tenant_subject ON trust_evidence_records(tenant_id, subject_id, observed_at DESC);

ALTER TABLE trust_decision_records ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'default';
ALTER TABLE trust_decision_records ADD COLUMN IF NOT EXISTS actor_id text;
ALTER TABLE trust_decision_records ADD COLUMN IF NOT EXISTS policy_version text NOT NULL DEFAULT 'v129.0';
ALTER TABLE trust_decision_records ADD COLUMN IF NOT EXISTS evidence_hash text;
ALTER TABLE trust_decision_records ADD COLUMN IF NOT EXISTS trace_id text;
ALTER TABLE trust_decision_records ADD COLUMN IF NOT EXISTS decision_version bigint NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_trust_decisions_tenant_time ON trust_decision_records(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trust_api_idempotency (
  scope text NOT NULL,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  status_code integer,
  response_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY(scope, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_trust_api_idempotency_expiry ON trust_api_idempotency(expires_at);

CREATE TABLE IF NOT EXISTS trust_outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  aggregate_id text NOT NULL,
  payload_json jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','published','failed')),
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_outbox_ready ON trust_outbox_events(status, available_at, created_at);

CREATE TABLE IF NOT EXISTS trust_customer_profiles (
  user_id uuid PRIMARY KEY REFERENCES trust_users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  phone text,
  city text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_merchant_onboarding (
  user_id uuid PRIMARY KEY REFERENCES trust_users(id) ON DELETE CASCADE,
  stage text NOT NULL,
  state_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
