# Revenue Engine V216

V216 separates **quoting** from **posting**. A quote is a deterministic calculation in minor currency units. Posting requires verifiable evidence and, when configured, persists to `trust_revenue_ledger` with tenant-scoped idempotency.

The engine is provider-neutral: it does not invent ad clicks, orders, fulfillment events, subscriptions or financial outcomes. External providers must produce evidence before a charge becomes posted revenue.
