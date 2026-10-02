-- V179 — autonomous commerce reality layer
-- Persistent policy/agent/action state. These tables turn the legacy fabric
-- helpers into auditable domain services without relying on process memory.
CREATE TABLE IF NOT EXISTS trust_agent_registry (
  agent_id text NOT NULL,
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  version text NOT NULL,
  capabilities text[] NOT NULL DEFAULT '{}',
  status text NOT NULL CHECK (status IN ('ACTIVE','DEGRADED','SUSPENDED')),
  trust_score numeric(5,4) NOT NULL CHECK (trust_score BETWEEN 0 AND 1),
  max_risk text NOT NULL CHECK (max_risk IN ('low','medium','high','critical')),
  max_autonomy text NOT NULL CHECK (max_autonomy IN ('SUGGEST','APPROVAL_REQUIRED','AUTO_EXECUTE')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, agent_id)
);
CREATE INDEX IF NOT EXISTS trust_agent_capability_idx ON trust_agent_registry USING gin(capabilities);
CREATE TABLE IF NOT EXISTS trust_autonomy_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  agent_id text NOT NULL,
  capability text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('ALLOWED','APPROVAL_REQUIRED','DENIED')),
  reason text NOT NULL,
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  risk text NOT NULL,
  estimated_cost numeric(14,2) NOT NULL DEFAULT 0,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_autonomy_actions_tenant_idx ON trust_autonomy_actions(tenant_id,created_at DESC);
CREATE TABLE IF NOT EXISTS trust_fraud_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  subject_id text NOT NULL,
  score numeric(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  risk text NOT NULL CHECK (risk IN ('low','medium','high','critical')),
  signals_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_fraud_assessments_subject_idx ON trust_fraud_assessments(tenant_id,subject_id,created_at DESC);
