# V324 — Customer Commerce Activation

## Real implementation
- Activated the existing durable wishlist storage through a real authenticated GET/POST/DELETE API.
- Wishlist ADD validates that the product exists and is active, then persists the mutation transactionally.
- Activated loyalty earning only from a customer-owned, delivered order; points are derived from the persisted order subtotal and a configurable points-per-100-EGP policy.
- Loyalty earning is idempotent, row-locked, persisted to the loyalty ledger/account, and emits a durable outbox event.
- No manual/public endpoint can award arbitrary points.

## Verification
- V324 source test passes.
- V323 financial-close source test passes.
- TypeScript strip-type syntax checks pass for the new/changed V324 files.
- PostgreSQL/provider E2E is not claimed because this archive does not contain a live production database or provider credentials.
