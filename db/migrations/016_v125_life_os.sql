CREATE TABLE IF NOT EXISTS trust_commerce_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), customer_id TEXT NOT NULL, signal_type TEXT NOT NULL,
  subject_key TEXT NOT NULL, value_json JSONB NOT NULL DEFAULT '{}'::jsonb, consent_status TEXT NOT NULL DEFAULT 'GRANTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trust_memory_customer ON trust_commerce_memory(customer_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS trust_life_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), customer_id TEXT NOT NULL, mission_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUGGESTED', plan_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), resolved_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS trust_family_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), customer_id TEXT NOT NULL, requester_role TEXT NOT NULL,
  mission_id UUID REFERENCES trust_life_missions(id), status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), decided_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS trust_warranty_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), customer_id TEXT NOT NULL, order_id TEXT,
  product_id TEXT, event_type TEXT NOT NULL, provider_ref TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
