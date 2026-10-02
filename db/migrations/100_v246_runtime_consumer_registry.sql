-- V246: make the V244 consumer mesh runtime-driven instead of definition-driven.
-- Existing V244 tables become the authoritative subscription and event-contract registry.
ALTER TABLE trust_commerce_events
  ADD COLUMN IF NOT EXISTS schema_version INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_trust_commerce_events_contract_v246
  ON trust_commerce_events(event_type, schema_version, occurred_at DESC);

INSERT INTO trust_event_schema_versions(event_type,version,schema_json,status) VALUES
('PRODUCT_VIEWED',1,'{"type":"object"}'::jsonb,'ACTIVE'),
('CART_UPDATED',1,'{"type":"object"}'::jsonb,'ACTIVE'),
('ORDER_PLACED',1,'{"type":"object"}'::jsonb,'ACTIVE'),
('PAYMENT_CONFIRMED',1,'{"type":"object"}'::jsonb,'ACTIVE'),
('SHIPMENT_UPDATED',1,'{"type":"object"}'::jsonb,'ACTIVE'),
('DELIVERED',1,'{"type":"object"}'::jsonb,'ACTIVE'),
('RETURN_REQUESTED',1,'{"type":"object"}'::jsonb,'ACTIVE'),
('REFUND_ISSUED',1,'{"type":"object"}'::jsonb,'ACTIVE'),
('SUPPORT_OPENED',1,'{"type":"object"}'::jsonb,'ACTIVE'),
('PROMOTION_ACTIVATED',1,'{"type":"object"}'::jsonb,'ACTIVE'),
('PAYMENT_STATUS_CHANGED',1,'{"type":"object"}'::jsonb,'ACTIVE'),
('RETURN_STATUS_CHANGED',1,'{"type":"object"}'::jsonb,'ACTIVE')
ON CONFLICT(event_type,version) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_trust_consumer_subscriptions_enabled_v246
  ON trust_consumer_subscriptions(event_type, enabled, consumer_id);

-- Backfill delivery rows only for events that already have a registered active subscription.
INSERT INTO trust_event_deliveries(tenant_id,event_id,consumer_id,status,attempts,next_attempt_at)
SELECT e.tenant_id,e.event_id,s.consumer_id,'PENDING',0,now()
  FROM trust_commerce_events e
  JOIN trust_consumer_subscriptions s ON s.event_type=e.event_type AND s.enabled=TRUE
 WHERE NOT EXISTS (
   SELECT 1 FROM trust_event_deliveries d
    WHERE d.tenant_id=e.tenant_id AND d.event_id=e.event_id AND d.consumer_id=s.consumer_id
 )
ON CONFLICT(tenant_id,event_id,consumer_id) DO NOTHING;
