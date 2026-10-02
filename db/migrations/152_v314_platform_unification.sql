-- TRUST V314 — unified control-plane evidence across infrastructure, payments, logistics, AI, risk, commerce, security, tenancy and analytics.
CREATE TABLE IF NOT EXISTS trust_v314_workflow_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, workflow text NOT NULL,
  stage text NOT NULL, approval text NOT NULL, idempotency_key text NOT NULL UNIQUE,
  correlation_id text NOT NULL, status text NOT NULL CHECK(status IN ('RUNNING','COMPLETED','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS trust_v314_workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), command_id uuid NOT NULL REFERENCES trust_v314_workflow_commands(id) ON DELETE CASCADE,
  stage text NOT NULL, status text NOT NULL CHECK(status IN ('STARTED','SUCCEEDED','FAILED')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(command_id,stage,status)
);
CREATE TABLE IF NOT EXISTS trust_v314_payment_idempotency (
  tenant_id text NOT NULL, idempotency_key text NOT NULL, operation text NOT NULL,
  fingerprint text NOT NULL, status text NOT NULL CHECK(status IN ('PROCESSING','SUCCEEDED','FAILED')),
  provider text, external_reference text, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS trust_v314_risk_decision_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, subject_type text NOT NULL,
  subject_id text NOT NULL, score numeric(8,4) NOT NULL, band text NOT NULL, signals jsonb NOT NULL,
  explanation jsonb NOT NULL, model_version text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,subject_type,subject_id)
);
CREATE TABLE IF NOT EXISTS trust_v314_operational_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text, workflow text NOT NULL, version text NOT NULL,
  status text NOT NULL CHECK(status IN ('PASS','FAIL')), checks jsonb NOT NULL, inputs_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_v314_workflow_tenant ON trust_v314_workflow_commands(tenant_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_v314_workflow_events_command ON trust_v314_workflow_events(command_id,created_at ASC);
CREATE INDEX IF NOT EXISTS idx_v314_risk_tenant_created ON trust_v314_risk_decision_evidence(tenant_id,created_at DESC);
