-- V245: real domain execution, durable effect ledger, and execution audit trails.
CREATE TABLE IF NOT EXISTS trust_domain_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  event_id UUID NOT NULL,
  consumer_id TEXT NOT NULL,
  effect_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('PROCESSING','COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(tenant_id, consumer_id, effect_key)
);
CREATE INDEX IF NOT EXISTS idx_trust_domain_effects_event ON trust_domain_effects(tenant_id,event_id);
CREATE TABLE IF NOT EXISTS trust_order_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id TEXT NOT NULL, order_id UUID NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  event_id UUID NOT NULL, event_type TEXT NOT NULL, payload_json JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(tenant_id,event_id)
);
CREATE INDEX IF NOT EXISTS idx_trust_order_execution_log_order ON trust_order_execution_log(tenant_id,order_id,created_at DESC);
CREATE TABLE IF NOT EXISTS trust_return_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id TEXT NOT NULL, return_id UUID NOT NULL REFERENCES trust_returns(id) ON DELETE CASCADE,
  event_id UUID NOT NULL, event_type TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(tenant_id,event_id)
);
CREATE INDEX IF NOT EXISTS idx_trust_return_execution_log_return ON trust_return_execution_log(tenant_id,return_id,created_at DESC);
