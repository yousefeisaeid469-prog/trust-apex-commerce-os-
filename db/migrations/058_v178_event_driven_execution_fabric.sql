-- V178 Event-Driven Execution Fabric: durable event envelope, consumer delivery and dead-letter state.
CREATE TABLE IF NOT EXISTS trust_commerce_events (
  event_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  sequence_no BIGINT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  correlation_id TEXT,
  causation_id TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_trust_commerce_events_order ON trust_commerce_events(tenant_id, aggregate_id, sequence_no);
CREATE INDEX IF NOT EXISTS idx_trust_commerce_events_tenant_time ON trust_commerce_events(tenant_id, occurred_at DESC);
CREATE TABLE IF NOT EXISTS trust_event_deliveries (
  tenant_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  consumer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, event_id, consumer_id)
);
CREATE TABLE IF NOT EXISTS trust_event_effects (
  tenant_id TEXT NOT NULL,
  effect_key TEXT NOT NULL,
  event_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, effect_key)
);
CREATE TABLE IF NOT EXISTS trust_event_dead_letters (
  tenant_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  consumer_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, event_id, consumer_id)
);
