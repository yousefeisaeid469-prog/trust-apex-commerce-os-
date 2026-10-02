# TRUST Developer API & SDK Foundation

TRUST exposes domain contracts for merchants and approved third-party integrations.

## Integration principles
- Version public APIs under `/api/v1/...` before exposing them externally.
- Use OAuth/service credentials rather than sharing admin sessions.
- Require idempotency keys for money-moving writes.
- Sign outbound webhooks and verify inbound webhook signatures.
- Publish JSON schemas/OpenAPI from the same TypeScript contracts where practical.

## SDK layout target
```
sdk/
  types/
  client/
  auth/
  webhooks/
  errors/
```

V120 establishes the documentation contract; generated SDK publishing should be wired to the final public API surface before external release.
