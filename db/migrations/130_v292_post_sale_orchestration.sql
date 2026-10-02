-- V292 — durable post-sale orchestration: return/refund/dispute/payout visibility and action history.
CREATE TABLE IF NOT EXISTS trust_post_sale_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL UNIQUE REFERENCES trust_returns(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  stage text NOT NULL CHECK(stage IN ('RETURN_REQUESTED','RETURN_APPROVED','RETURN_RECEIVED','INSPECTION','REFUND_PENDING','REFUNDED','RETURN_REJECTED','CLOSED')),
  last_event text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_post_sale_cases_stage ON trust_post_sale_cases(stage,updated_at ASC);
CREATE INDEX IF NOT EXISTS idx_trust_post_sale_cases_customer ON trust_post_sale_cases(customer_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS trust_post_sale_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES trust_post_sale_cases(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor_id uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  idempotency_key text,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(case_id,action,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_trust_post_sale_actions_case ON trust_post_sale_actions(case_id,created_at DESC);

ALTER TABLE platform_notifications DROP CONSTRAINT IF EXISTS platform_notifications_topic_check;
ALTER TABLE trust_notification_preferences DROP CONSTRAINT IF EXISTS trust_notification_preferences_topic_check;
ALTER TABLE trust_notification_preferences ADD CONSTRAINT trust_notification_preferences_topic_check CHECK(topic IN ('ORDER_CONFIRMED','ORDER_PROCESSING','ORDER_SHIPPED','ORDER_DELIVERED','ORDER_CANCELLED','ORDER_REFUNDED','DELIVERY_ATTENTION','RETURN_REQUESTED','RETURN_APPROVED','RETURN_RECEIVED','REFUND_PENDING','REFUND_SUCCEEDED','REFUND_FAILED','DISPUTE_OPENED','PAYOUT_UPDATED'));
CREATE INDEX IF NOT EXISTS idx_trust_post_sale_cases_order ON trust_post_sale_cases(order_id,updated_at DESC);
