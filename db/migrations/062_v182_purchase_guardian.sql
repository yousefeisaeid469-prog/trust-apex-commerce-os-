-- TRUST V182 — Purchase Guardian: durable post-purchase lifecycle layer.
CREATE INDEX IF NOT EXISTS idx_trust_warranty_customer_order ON trust_warranty_events(customer_id,order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_warranty_type ON trust_warranty_events(event_type,created_at DESC);
CREATE TABLE IF NOT EXISTS trust_purchase_guardian_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), customer_id TEXT NOT NULL, order_id TEXT NOT NULL,
 event_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'recorded' CHECK(status IN ('recorded','resolved')),
 payload_json JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_guardian_events_customer ON trust_purchase_guardian_events(customer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guardian_events_order ON trust_purchase_guardian_events(order_id,created_at DESC);
