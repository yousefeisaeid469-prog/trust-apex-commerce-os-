-- V388 — Global Marketplace Order OS
-- Add only indexes required by the live read model. The OS itself reads existing
-- authoritative order/payment/fulfillment/return/payout/revenue tables directly.
CREATE INDEX IF NOT EXISTS trust_global_payment_lifecycle_order_time_idx
  ON trust_global_payment_lifecycle_events(order_id,occurred_at DESC);
CREATE INDEX IF NOT EXISTS trust_marketplace_balance_releases_order_time_idx
  ON trust_marketplace_balance_releases(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_refunds_payment_time_idx
  ON trust_refunds(payment_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_returns_order_time_idx
  ON trust_returns(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS trust_revenue_ledger_order_time_idx
  ON trust_revenue_ledger(order_id,created_at DESC);
