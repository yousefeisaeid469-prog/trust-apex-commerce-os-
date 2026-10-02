-- TRUST V84 production migration. Run inside a controlled migration transaction.
-- Idempotency + webhook replay protection + operational query indexes.
create unique index if not exists ux_idempotency_scope_key on idempotency_records(scope, key);
create unique index if not exists ux_payment_events_provider_event on payment_events(provider, provider_event_id);
create index if not exists ix_orders_customer_created on orders(customer_id, created_at desc);
create index if not exists ix_orders_merchant_created on orders(merchant_id, created_at desc);
create index if not exists ix_inventory_ledger_product_created on inventory_ledger(product_id, created_at desc);
create index if not exists ix_outbox_pending on outbox_events(status, created_at);
create index if not exists ix_audit_actor_created on audit_events(actor_id, created_at desc);
