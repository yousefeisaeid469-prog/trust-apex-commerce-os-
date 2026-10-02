-- V230 follow-up: durable in-app notification read state and customer-scoped access.
ALTER TABLE platform_notifications ADD COLUMN IF NOT EXISTS read_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_platform_notifications_unread ON platform_notifications(recipient_id, read_at, created_at DESC);
