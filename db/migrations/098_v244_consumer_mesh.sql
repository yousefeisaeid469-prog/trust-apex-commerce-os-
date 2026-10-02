-- V244: domain consumer mesh, contract registry and poison-event isolation.
CREATE TABLE IF NOT EXISTS trust_consumer_subscriptions (
  consumer_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  contract_version INTEGER NOT NULL DEFAULT 1,
  max_attempts INTEGER NOT NULL DEFAULT 8 CHECK (max_attempts > 0 AND max_attempts <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (consumer_id, event_type)
);

CREATE TABLE IF NOT EXISTS trust_event_schema_versions (
  event_type TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  schema_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DEPRECATED','RETIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_type, version)
);

CREATE TABLE IF NOT EXISTS trust_event_consumer_failures (
  tenant_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  consumer_id TEXT NOT NULL,
  failure_class TEXT NOT NULL,
  reason TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  occurrences INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, event_id, consumer_id)
);

CREATE INDEX IF NOT EXISTS idx_trust_event_deliveries_consumer_lag_v244
  ON trust_event_deliveries(consumer_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_trust_event_deliveries_tenant_status_v244
  ON trust_event_deliveries(tenant_id, status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_trust_event_failures_consumer_v244
  ON trust_event_consumer_failures(consumer_id, last_seen_at DESC);

INSERT INTO trust_consumer_subscriptions(consumer_id,event_type,max_attempts) VALUES
('order','ORDER_PLACED',8),('order','PAYMENT_CONFIRMED',8),('order','RETURN_REQUESTED',8),('order','REFUND_ISSUED',8),
('payment','ORDER_PLACED',8),('payment','REFUND_ISSUED',8),
('inventory','ORDER_PLACED',10),('inventory','RETURN_REQUESTED',10),
('fulfillment','PAYMENT_CONFIRMED',10),('fulfillment','SHIPMENT_UPDATED',10),('fulfillment','DELIVERED',10),('fulfillment','RETURN_REQUESTED',10),
('returns','RETURN_REQUESTED',8),('returns','REFUND_ISSUED',8),
('notification','ORDER_PLACED',12),('notification','PAYMENT_CONFIRMED',12),('notification','SHIPMENT_UPDATED',12),('notification','DELIVERED',12),('notification','REFUND_ISSUED',12),('notification','SUPPORT_OPENED',12),
('customer','PRODUCT_VIEWED',8),('customer','CART_UPDATED',8),('customer','ORDER_PLACED',8),('customer','DELIVERED',8),('customer','RETURN_REQUESTED',8),('customer','SUPPORT_OPENED',8)
ON CONFLICT (consumer_id,event_type) DO NOTHING;
