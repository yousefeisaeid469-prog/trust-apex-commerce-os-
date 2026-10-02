-- TRUST V107: commerce transaction engine hardening.
-- Run after V83/V105 schema migrations.
create unique index if not exists trust_orders_customer_idempotency_idx
  on trust_orders(customer_id,idempotency_key)
  where idempotency_key is not null;

create index if not exists trust_inventory_reservation_expiry_idx
  on trust_inventory_reservations(status,expires_at);

create index if not exists trust_outbox_available_idx
  on trust_outbox_events(status,available_at,created_at);

create index if not exists trust_payment_events_intent_idx
  on trust_payment_events(payment_intent_id,received_at desc);

alter table trust_orders drop constraint if exists trust_orders_status_check;
alter table trust_orders add constraint trust_orders_status_check
  check(status in ('pending','confirmed','processing','shipped','delivered','cancelled','payment_failed','refunded'));
