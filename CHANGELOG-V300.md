# V300 — Global Payment Execution + Order Lifecycle

- Added migration 138 for durable global payment lifecycle evidence.
- Added global payment execution runtime module.
- Wired global payment creation to CREATED and PROVIDER_QUEUED lifecycle events.
- Wired payment webhook transitions into the global lifecycle.
- Added execution timestamps, failure code field, and execution attempt counter.
