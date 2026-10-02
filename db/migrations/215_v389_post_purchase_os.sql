-- V389 — post-purchase eligibility and read-path indexes.
CREATE INDEX IF NOT EXISTS trust_orders_customer_status_created_idx ON trust_orders(customer_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_order_items_product_order_idx ON trust_order_items(product_id,order_id);
CREATE INDEX IF NOT EXISTS trust_loyalty_ledger_customer_key_idx ON trust_marketplace_loyalty_ledger(customer_id,idempotency_key);
CREATE INDEX IF NOT EXISTS trust_notifications_recipient_topic_created_idx ON platform_notifications(recipient_id,topic,created_at DESC);
