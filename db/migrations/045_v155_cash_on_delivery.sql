-- V155 — Cash on Delivery
-- Egyptian/Arab shoppers overwhelmingly prefer paying on delivery over
-- pre-paying a card online to a store they don't yet trust — this is the
-- single highest-leverage trust lever available before a real payment
-- gateway (Fawry/Paymob) is integrated. COD orders skip the online
-- payment-intent step entirely and go straight to 'confirmed': the money
-- changes hands at the door, not at checkout.

ALTER TABLE trust_orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod','card'));
-- Note: 'confirmed' was already a valid trust_orders.status value in migration
-- 044's original CHECK constraint, so no constraint change is needed here.

