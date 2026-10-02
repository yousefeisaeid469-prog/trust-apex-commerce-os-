-- TRUST V231 — Commerce Execution: provider-gated payment entry, webhook inbox linkage,
-- and durable order-state execution primitives. No external provider is fabricated.
ALTER TABLE trust_webhook_inbox ADD COLUMN IF NOT EXISTS processing_attempts integer NOT NULL DEFAULT 0 CHECK (processing_attempts >= 0);
CREATE INDEX IF NOT EXISTS idx_trust_webhook_inbox_status_updated ON trust_webhook_inbox(status, updated_at ASC);

ALTER TABLE trust_payment_events ADD COLUMN IF NOT EXISTS webhook_inbox_id uuid REFERENCES trust_webhook_inbox(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_trust_payment_events_inbox ON trust_payment_events(webhook_inbox_id);

CREATE INDEX IF NOT EXISTS idx_trust_orders_status_created ON trust_orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_order_items_order_product ON trust_order_items(order_id, product_id);
