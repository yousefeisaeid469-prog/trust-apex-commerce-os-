-- TRUST V313 — Platform Foundation: infrastructure, payments, decisioning, risk, commerce, security, tenancy, analytics and evidence.
CREATE TABLE IF NOT EXISTS trust_v313_payment_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), idempotency_key text NOT NULL UNIQUE, order_id uuid, currency text NOT NULL, status text NOT NULL CHECK(status IN ('POSTED','REVERSED')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_v313_payment_journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), journal_id uuid NOT NULL REFERENCES trust_v313_payment_journals(id) ON DELETE CASCADE, account text NOT NULL, side text NOT NULL CHECK(side IN ('DEBIT','CREDIT')), amount_minor numeric(30,0) NOT NULL CHECK(amount_minor>0), currency text NOT NULL, UNIQUE(journal_id,account,side)
);
CREATE TABLE IF NOT EXISTS trust_v313_payment_provider_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), payment_id uuid, provider text NOT NULL, attempt integer NOT NULL CHECK(attempt>0), status text NOT NULL CHECK(status IN ('SELECTED','SUCCEEDED','FAILED')), reason text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(payment_id,attempt)
);
CREATE TABLE IF NOT EXISTS trust_v313_payment_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text NOT NULL, external_reference text NOT NULL, expected_minor numeric(30,0) NOT NULL, provider_minor numeric(30,0) NOT NULL, status text NOT NULL CHECK(status IN ('MATCH','MISMATCH')), delta_minor numeric(30,0) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(provider,external_reference)
);
CREATE TABLE IF NOT EXISTS trust_v313_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, workflow text NOT NULL, stage text NOT NULL, action text NOT NULL, confidence numeric(8,6) NOT NULL, risk numeric(8,4) NOT NULL, requires_human_approval boolean NOT NULL, outcome text, model_version text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_v313_risk_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, subject_type text NOT NULL, subject_id text NOT NULL, score numeric(8,4) NOT NULL, band text NOT NULL, signals jsonb NOT NULL DEFAULT '[]'::jsonb, explainable boolean NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,subject_type,subject_id)
);
CREATE TABLE IF NOT EXISTS trust_v313_country_profiles (
  country text PRIMARY KEY, currency text NOT NULL, languages jsonb NOT NULL, tax_model text NOT NULL, checkout_methods jsonb NOT NULL, catalog_region text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_v313_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, actor_id text NOT NULL, event_type text NOT NULL, resource text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_v313_tenants (
  id text PRIMARY KEY, status text NOT NULL CHECK(status IN ('ACTIVE','SUSPENDED')), plan text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_v313_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, event_type text NOT NULL, occurred_at timestamptz NOT NULL, properties jsonb NOT NULL DEFAULT '{}'::jsonb, UNIQUE(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS trust_v313_evidence_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workflow text NOT NULL, status text NOT NULL CHECK(status IN ('PASS','FAIL')), checks jsonb NOT NULL, evidence_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_v313_backup_restore_drills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), backup_checksum text NOT NULL, restored_checksum text NOT NULL, critical_rows_before bigint NOT NULL, critical_rows_after bigint NOT NULL, status text NOT NULL CHECK(status IN ('PASS','FAIL')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_v313_decisions_tenant_created ON trust_v313_decisions(tenant_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_v313_security_events_tenant_created ON trust_v313_security_events(tenant_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_v313_analytics_tenant_time ON trust_v313_analytics_events(tenant_id,occurred_at DESC);
