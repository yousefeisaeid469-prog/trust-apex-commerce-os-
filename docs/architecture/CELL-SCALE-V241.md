# TRUST V241 — Cell-Scale Architecture

V241 introduces a concrete scale-out boundary: a TRUST deployment can route tenants deterministically to independent execution cells, with a PostgreSQL pool per active cell.

## Model

`tenantId -> deterministic cell -> cell database pool -> domain transaction`

A cell is an operational isolation boundary. `TRUST_CELL_COUNT` controls deterministic bucket count, while `TRUST_CELL_<ID>_DATABASE_URL` can point a cell at its own PostgreSQL cluster. When a dedicated URL is absent, the cell safely falls back to `DATABASE_URL`, preserving single-database development and staged rollout.

## Why this scales

- Tenant traffic can be spread across independent database pools.
- A hot tenant remains addressable without forcing every tenant onto the same connection pool.
- Queue and webhook hot paths receive targeted indexes.
- The migration is additive; existing V240 data remains compatible.
- Routing is deterministic, so repeated requests for the same tenant select the same cell.

## Important production boundary

This is a scale-out foundation, not a claim that TRUST is already operating at Amazon scale. To operate multiple cells, deployment infrastructure must provision the databases, migrations, observability, backups, failover, and traffic controls for each cell. Those are real infrastructure responsibilities and are intentionally not faked in application code.
