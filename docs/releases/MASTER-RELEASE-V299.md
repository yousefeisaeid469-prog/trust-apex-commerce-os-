# TRUST V299.0.0 — Global Payment Runtime

V299 turns global payment capability into a durable application runtime. A global order can now create a payment attempt only when country, currency, payment method, and provider are mutually compatible. The attempt is idempotent and linked to `trust_payments`; payment webhook transitions synchronize the attempt status.

External providers remain an integration boundary and must be configured through the existing provider adapter.
