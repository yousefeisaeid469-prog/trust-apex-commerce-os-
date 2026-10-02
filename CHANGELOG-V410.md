# V410 — Global Production Worker Plane

V410 establishes a canonical production worker control plane for command, workflow, and commerce execution workers.

## Delivered
- Durable worker identity and lease ownership in PostgreSQL.
- Heartbeat and lease renewal with explicit lease-loss failure.
- Worker run accounting with claimed/succeeded/failed/recovered counters.
- Canonical worker health snapshot view.
- Command, workflow, and commerce execution workers wired to the same worker plane.
- V410 audit/test/release gates.

## Verification boundary
- Static worker-plane tests and migration/release checks are required and run locally.
- Full TypeScript/build and live PostgreSQL integration require installed dependencies and DATABASE_URL; they are not claimed by this artifact without those prerequisites.
