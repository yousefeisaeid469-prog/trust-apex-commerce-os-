-- TRUST V310 — Global Logistics Promise Enforcement
ALTER TABLE trust_shipments ADD COLUMN IF NOT EXISTS promised_at timestamptz;
UPDATE trust_shipments SET promised_at=eta_at WHERE promised_at IS NULL AND eta_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trust_shipments_promise ON trust_shipments(status,promised_at) WHERE promised_at IS NOT NULL;
CREATE TABLE IF NOT EXISTS trust_global_logistics_promise_actions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE RESTRICT,
 shipment_id uuid NOT NULL REFERENCES trust_shipments(id) ON DELETE RESTRICT,
 promise_risk text NOT NULL CHECK(promise_risk IN ('ON_TRACK','AT_RISK','BREACH')),
 risk_score integer NOT NULL CHECK(risk_score BETWEEN 0 AND 100), minutes_to_promise integer, slack_minutes integer,
 reasons jsonb NOT NULL DEFAULT '[]'::jsonb, recommended_action text NOT NULL CHECK(recommended_action IN ('NO_ACTION','MONITOR','ACCELERATE','REPLAN_CARRIER','ESCALATE_PROMISE_BREACH')),
 status text NOT NULL DEFAULT 'QUEUED' CHECK(status IN ('QUEUED','DISPATCHED','SUCCEEDED','FAILED','CANCELLED')),
 idempotency_key text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_global_logistics_promise_actions_order ON trust_global_logistics_promise_actions(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_logistics_promise_actions_ready ON trust_global_logistics_promise_actions(status,created_at);
CREATE INDEX IF NOT EXISTS idx_global_logistics_promise_actions_risk ON trust_global_logistics_promise_actions(promise_risk,created_at DESC);
