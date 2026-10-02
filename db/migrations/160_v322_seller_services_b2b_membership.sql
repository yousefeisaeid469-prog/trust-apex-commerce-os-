-- V322: durable seller-services, B2B service charges, and customer-membership billing events.
-- Additive only. Existing V270/V320 surfaces remain intact.

CREATE TABLE IF NOT EXISTS trust_seller_service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  service_code text NOT NULL,
  description text NOT NULL,
  amount numeric(18,2) NOT NULL CHECK(amount>0),
  currency char(3) NOT NULL,
  status text NOT NULL DEFAULT 'PAID' CHECK(status IN ('PENDING','PAID','REFUNDED','CANCELLED')),
  provider text NOT NULL DEFAULT 'internal',
  provider_reference text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_seller_service_orders_merchant_idx
  ON trust_seller_service_orders(merchant_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_b2b_service_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  b2b_account_id uuid NOT NULL REFERENCES trust_marketplace_b2b_accounts(id) ON DELETE CASCADE,
  service_code text NOT NULL,
  order_id uuid REFERENCES trust_orders(id) ON DELETE SET NULL,
  amount numeric(18,2) NOT NULL CHECK(amount>0),
  currency char(3) NOT NULL,
  status text NOT NULL DEFAULT 'CHARGED' CHECK(status IN ('CHARGED','REFUNDED','VOID')),
  idempotency_key text NOT NULL UNIQUE,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_b2b_service_charges_account_idx
  ON trust_b2b_service_charges(b2b_account_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_customer_membership_billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES trust_marketplace_customer_memberships(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK(event_type IN ('INITIAL_CHARGE','RENEWAL','REFUND','VOID')),
  amount numeric(18,2) NOT NULL CHECK(amount>=0),
  currency char(3) NOT NULL DEFAULT 'EGP',
  provider text NOT NULL DEFAULT 'internal',
  provider_reference text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_customer_membership_billing_events_idx
  ON trust_customer_membership_billing_events(membership_id,created_at DESC);
