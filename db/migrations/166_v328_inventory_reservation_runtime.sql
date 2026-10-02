-- V328 — production inventory reservation lifecycle.
-- Reservations already protect checkout stock. This migration makes their
-- lifecycle observable and safely reclaimable when a card checkout expires.
CREATE TABLE IF NOT EXISTS trust_inventory_reservation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES trust_inventory_reservations(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES trust_orders(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('RESERVED','CONSUMED','RELEASED','EXPIRED')),
  quantity integer NOT NULL CHECK (quantity > 0),
  reason text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_inventory_reservation_events_order
  ON trust_inventory_reservation_events(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_inventory_reservation_events_reservation
  ON trust_inventory_reservation_events(reservation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trust_inventory_reservations_expirable_v328
  ON trust_inventory_reservations(status, expires_at, id)
  WHERE status = 'reserved';

ALTER TABLE trust_inventory_reservations
  ADD COLUMN IF NOT EXISTS consumed_at timestamptz,
  ADD COLUMN IF NOT EXISTS released_at timestamptz,
  ADD COLUMN IF NOT EXISTS release_reason text;

-- One lifecycle event per reservation transition key. The application still
-- validates the state transition under row lock before inserting the event.
