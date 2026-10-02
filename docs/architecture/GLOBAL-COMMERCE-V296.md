# TRUST V296 — Global Commerce Architecture

The global commerce layer centralizes country policy, money arithmetic, FX validation, tax calculation boundaries, shipping options, and payment-method eligibility.

The pricing invariant remains: all amounts are represented in integer minor units, currency mismatches fail closed, and an FX conversion requires an explicit unexpired quote. External provider connectivity is intentionally separated from deterministic domain logic.
