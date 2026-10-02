# TRUST APEX OS — MASTER RELEASE V322

V322 closes three monetization execution gaps without creating another audit-only layer.

- Seller Services: transactional service purchase -> revenue ledger -> merchant finance fee.
- B2B: approved account -> service charge -> B2B revenue ledger.
- Customer Membership: renewal billing event -> subscription revenue ledger -> next renewal date.

Migration sequence: 160 is appended after V321.

Validation performed:
- `tests/v322-revenue-expansion-source.test.mjs` PASS.
- Migration numbering checked for V322 append-only continuity.

Not claimed: live external payment-provider collection, live recurring billing, or production PostgreSQL E2E. Those require deployment credentials/provider webhooks and a real database environment.
