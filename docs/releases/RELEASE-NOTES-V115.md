# TRUST V115 — Platform Operating System

V115 turns the existing Commerce + Customer + Merchant + Logistics + Intelligence + Agent stack into a unified operating layer.

## Added
- Typed domain Event Bus with correlation/causation metadata and consumer abstraction.
- Workflow Engine contracts with retryable steps and compensation hooks.
- Background Jobs queue contract with attempts, retry states and dead-letter state.
- Notifications abstraction for in-app/email/SMS/push, preferences and dedupe.
- Provider-neutral Search Index/query boundary.
- Platform configuration boundary with server-only secret access and feature controls.
- Private `/platform-os` command dashboard and admin-gated APIs.
- PostgreSQL migration `007_v115_platform_os.sql` for durable production tables.

## Important
The runtime adapters in this release are safe in-memory foundations. The SQL schema is the durability contract; production deployment must connect event/job/workflow/notification/search workers to the selected infrastructure.
