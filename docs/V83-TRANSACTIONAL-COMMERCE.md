# V83 Transactional Commerce

## Checkout invariant
A successful transactional checkout must atomically:
1. verify every product exists and is active;
2. lock product rows with `FOR UPDATE`;
3. verify stock;
4. create the order and order items;
5. decrement inventory;
6. append inventory ledger records;
7. enqueue `order.created` in the outbox;
8. persist the idempotency result.

If any step fails, the database transaction rolls back.

## Payment webhook invariant
Provider events are accepted only when their HMAC signature is valid. Provider event IDs are unique, so a retried webhook is treated as a duplicate instead of applying the business transition twice.

## Outbox
Business transactions write an outbox row in the same transaction. A worker can later publish pending rows with retry/backoff semantics without losing events between the database commit and message publication.
