# V405 — Global Commerce Event + Workflow Orchestration

- Added durable PostgreSQL workflow instances, ordered steps, compensation metadata and immutable workflow transition events.
- Added workflow orchestrator and workflow worker with row locking, bounded retries, lease recovery and compensation execution.
- Routed workflow commands through the V404 command bus and existing registered domain handlers.
- Added workflow start/status APIs.
- Added V405 audit/release gates and migration 230.
- Validation: workflow audit PASS; V404 audit PASS; release gate PASS; migration check PASS (230 canonical migrations).
- Full live PostgreSQL execution was not claimed because no DATABASE_URL was configured in the build environment.
