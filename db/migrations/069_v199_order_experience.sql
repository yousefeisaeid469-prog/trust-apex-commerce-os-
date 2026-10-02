-- V199 — durable customer order timeline and post-purchase experience.
CREATE TABLE IF NOT EXISTS trust_order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL CHECK (to_status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  source text NOT NULL DEFAULT 'system',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_order_status_history_order ON trust_order_status_history(order_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_trust_order_status_history_status ON trust_order_status_history(to_status, created_at DESC);

INSERT INTO trust_order_status_history(order_id, from_status, to_status, source, note)
SELECT o.id, NULL, o.status, 'migration_backfill', 'Initial order status'
FROM trust_orders o
WHERE NOT EXISTS (SELECT 1 FROM trust_order_status_history h WHERE h.order_id=o.id);
