-- V344 migration-gap closure.
--
-- V330/V331 did not ship a canonical database schema change, but the
-- migration ledger must remain contiguous because scripts/migrate.mjs treats
-- migration identity as an ordered contract. This migration is intentionally
-- a transactional no-op so existing databases that already applied 169+
-- can safely record 168 without changing application data.
SELECT 1;
