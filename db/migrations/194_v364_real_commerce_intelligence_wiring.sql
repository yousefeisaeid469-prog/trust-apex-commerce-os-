-- V364: connect restored intelligence runtimes to the real commerce event flow.
CREATE TABLE IF NOT EXISTS trust_commerce_intelligence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  brain JSONB NOT NULL,
  growth_network JSONB NOT NULL,
  global_graph JSONB NOT NULL,
  revenue_plan JSONB NOT NULL,
  revenue_economics JSONB NOT NULL,
  revenue_scenarios JSONB NOT NULL,
  growth_plan JSONB NOT NULL,
  copilot JSONB NOT NULL,
  event_summary JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,event_id)
);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_intelligence_tenant_created
  ON trust_commerce_intelligence_snapshots(tenant_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_intelligence_aggregate
  ON trust_commerce_intelligence_snapshots(tenant_id,aggregate_id,created_at DESC);

INSERT INTO trust_consumer_subscriptions(consumer_id,event_type,enabled,contract_version,max_attempts)
VALUES
 ('commerce-intelligence','ORDER_PLACED',true,1,8),
 ('commerce-intelligence','PAYMENT_CONFIRMED',true,1,8),
 ('commerce-intelligence','DELIVERED',true,1,8),
 ('commerce-intelligence','RETURN_REQUESTED',true,1,8),
 ('autonomous-commerce-orchestrator','ORDER_PLACED',true,1,8),
 ('autonomous-commerce-orchestrator','PAYMENT_CONFIRMED',true,1,8),
 ('autonomous-commerce-orchestrator','DELIVERED',true,1,8),
 ('autonomous-commerce-orchestrator','RETURN_REQUESTED',true,1,8)
ON CONFLICT(consumer_id,event_type) DO UPDATE
SET enabled=EXCLUDED.enabled, contract_version=EXCLUDED.contract_version, max_attempts=EXCLUDED.max_attempts, updated_at=now();
