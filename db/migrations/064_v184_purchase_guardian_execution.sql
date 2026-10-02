-- TRUST V184 — approved Purchase Guardian actions execute only through authorized adapters.
ALTER TABLE trust_purchase_guardian_actions ADD COLUMN IF NOT EXISTS execution_adapter TEXT;
ALTER TABLE trust_purchase_guardian_actions ADD COLUMN IF NOT EXISTS execution_provider_reference TEXT;
ALTER TABLE trust_purchase_guardian_actions ADD COLUMN IF NOT EXISTS execution_reason TEXT;
CREATE TABLE IF NOT EXISTS trust_purchase_guardian_execution_attempts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), action_id UUID NOT NULL REFERENCES trust_purchase_guardian_actions(id) ON DELETE CASCADE,
 customer_id TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('EXECUTED','FAILED','BLOCKED','DUPLICATE')),
 adapter TEXT, provider_reference TEXT, reason TEXT NOT NULL, attempts INTEGER NOT NULL CHECK(attempts>=0), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_guardian_execution_customer ON trust_purchase_guardian_execution_attempts(customer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guardian_execution_action ON trust_purchase_guardian_execution_attempts(action_id,created_at DESC);
