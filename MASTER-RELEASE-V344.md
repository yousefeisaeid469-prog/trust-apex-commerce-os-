# TRUST APEX OS — V344.0.0

## Migration Gap Closure

V344 restores canonical migration continuity by adding migration `168_v330_v331_historical_bridge.sql`.

The migration is intentionally a transactional no-op because the V330/V331 transition has no known canonical database schema change in this repository. Its purpose is to preserve migration identity without renumbering migrations that may already be recorded on deployed databases.

The migration checker now requires strict `001..N` continuity with no historical-gap exception. `scripts/migrate.mjs` therefore runs against the same canonical sequence used by the checker.

### Verification

- Migration 168 exists.
- Migration numbering is contiguous from 001 through the latest migration.
- Migration manifest contains the checksum for migration 168.
- Existing migrations 169+ retain their original identities.
