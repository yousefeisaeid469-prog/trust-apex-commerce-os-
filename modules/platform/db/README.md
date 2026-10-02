# TRUST V107 Data Layer

V107 introduces a real PostgreSQL adapter and transactional checkout path.

## Production flow

`HTTP request -> authenticated user -> PostgreSQL transaction -> row locks -> order + inventory + reservation + outbox + idempotency -> COMMIT`

The application fails closed when `DATABASE_URL` is absent for the production checkout endpoint.
