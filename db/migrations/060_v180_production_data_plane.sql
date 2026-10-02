-- V180 — Production Data Plane: indexes and invariants for durable autonomous-commerce state.
CREATE INDEX IF NOT EXISTS idx_trust_agent_registry_status ON trust_agent_registry(tenant_id,status);
CREATE INDEX IF NOT EXISTS idx_trust_autonomy_actions_agent_time ON trust_autonomy_actions(tenant_id,agent_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_fraud_assessments_risk_time ON trust_fraud_assessments(tenant_id,risk,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_orders_created_status ON trust_orders(created_at DESC,status);
CREATE INDEX IF NOT EXISTS idx_trust_outbox_events_created ON trust_outbox_events(created_at DESC);

-- Prevent negative inventory even if a future caller forgets the pre-lock check.
ALTER TABLE trust_products DROP CONSTRAINT IF EXISTS trust_products_stock_nonnegative;
ALTER TABLE trust_products ADD CONSTRAINT trust_products_stock_nonnegative CHECK (stock >= 0);
