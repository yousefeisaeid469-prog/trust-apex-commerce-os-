# V333 — Payment Amount Authority

- Prevented public payment endpoints from trusting browser-supplied payment amounts.
- Made PostgreSQL order total/currency authoritative under transaction lock.
- Preserved idempotency semantics using server-derived payment values.
- Corrected payment capability reporting when a provider is not configured.
- Added a regression test for amount-authority behavior.
