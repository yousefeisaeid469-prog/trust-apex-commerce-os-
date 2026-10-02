# TRUST V105 — Data Core Foundation

## Scope
V105 adds the first cohesive Data Core layer above the existing V104 experience.

### Added
- Domain entity contracts for products, merchants, and orders.
- Generic repository interface with an in-memory implementation.
- Centralized demo store and platform snapshot service.
- `/api/data-core` health/snapshot endpoint.
- `/api/products`, `/api/merchants`, `/api/orders` read APIs.
- `/data-core` architecture/health view.
- Command Palette entry for Data Core.

### Important boundary
Persistence is intentionally marked `demo`. No claim is made that these repositories are durable production storage. The next production step is a real database adapter (PostgreSQL/ORM), migrations, transactions, idempotency, authorization, and audit enforcement.
