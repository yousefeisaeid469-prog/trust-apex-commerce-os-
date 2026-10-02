# V325 — Financial Integrity Close

V325 closes two concrete accounting defects in the marketplace settlement path:

1. Settlement `gross_amount` includes the customer order total, which may include shipping, while seller fee/net arithmetic is based on merchandise lines. A durable `merchandise_gross` field now separates those concepts and the financial-close invariant uses it.
2. Refund seller-settlement reversal now uses merchandise gross for its proportional allocation instead of customer gross, preventing shipping from distorting seller reversal ratios.
3. Settlement status explicitly supports `PENDING`, `RELEASED`, and `REVERSED`, matching the runtime refund/release state machine.

No existing feature was removed. This is an additive correctness release.
