-- TRUST V183 — Purchase Guardian Agent: policy-bounded action planning and approval state.
CREATE TABLE IF NOT EXISTS trust_purchase_guardian_actions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), customer_id TEXT NOT NULL, order_id TEXT NOT NULL,
 action_type TEXT NOT NULL CHECK(action_type IN ('review_return','review_warranty','review_delivery','resolve_attention')),
 risk TEXT NOT NULL CHECK(risk IN ('low','medium','high')), confidence NUMERIC(5,4) NOT NULL CHECK(confidence>=0 AND confidence<=1),
 reversible BOOLEAN NOT NULL, status TEXT NOT NULL CHECK(status IN ('PROPOSED','APPROVAL_REQUIRED','APPROVED','EXECUTED','FAILED')),
 reason TEXT NOT NULL, approved_at TIMESTAMPTZ, executed_at TIMESTAMPTZ, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_guardian_actions_customer_status ON trust_purchase_guardian_actions(customer_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guardian_actions_order ON trust_purchase_guardian_actions(order_id,created_at DESC);
