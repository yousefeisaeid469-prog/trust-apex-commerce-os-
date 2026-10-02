# V344 — Migration Sequence Integrity

- Added canonical migration `168_v330_v331_historical_bridge.sql` to close the historical numbering gap without renumbering migrations already deployed.
- Removed the special-case allowance for migration 168 from `scripts/migration_check.mjs`.
- Restored strict contiguous migration validation from `001` through the latest migration.
- Kept `scripts/migrate.mjs` and the migration checker aligned on the same sequence contract.
- Added a release-level regression check for the migration gap closure.
