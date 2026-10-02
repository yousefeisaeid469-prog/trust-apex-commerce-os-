-- V200 — durable post-purchase notifications and customer preferences.
ALTER TABLE platform_notifications ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE platform_notifications ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE platform_notifications ADD COLUMN IF NOT EXISTS last_error text;
ALTER TABLE platform_notifications ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE platform_notifications ADD COLUMN IF NOT EXISTS lease_until timestamptz;
ALTER TABLE platform_notifications ADD COLUMN IF NOT EXISTS locked_by text;
ALTER TABLE platform_notifications DROP CONSTRAINT IF EXISTS platform_notifications_status_check;
ALTER TABLE platform_notifications ADD CONSTRAINT platform_notifications_status_check CHECK(status IN ('QUEUED','PROCESSING','SENT','FAILED','SUPPRESSED'));
CREATE INDEX IF NOT EXISTS idx_platform_notifications_recipient_created ON platform_notifications(recipient_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_notifications_queue ON platform_notifications(status,created_at ASC);
CREATE INDEX IF NOT EXISTS idx_platform_notifications_lease ON platform_notifications(status,lease_until);
CREATE TABLE IF NOT EXISTS trust_notification_preferences (
 customer_id text NOT NULL,
 channel text NOT NULL CHECK(channel IN ('IN_APP','EMAIL','SMS','WHATSAPP')),
 topic text NOT NULL CHECK(topic IN ('ORDER_CONFIRMED','ORDER_PROCESSING','ORDER_SHIPPED','ORDER_DELIVERED','ORDER_CANCELLED','ORDER_REFUNDED','DELIVERY_ATTENTION')),
 enabled boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(customer_id,channel,topic)
);
CREATE INDEX IF NOT EXISTS idx_trust_notification_preferences_customer ON trust_notification_preferences(customer_id);
