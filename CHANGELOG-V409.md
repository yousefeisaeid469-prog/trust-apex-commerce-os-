# V409 — Production Failure Closure & Recovery

V409 extends V408 with a durable failure-closure layer. Execution failures are classified by production boundary (payment, inventory, fulfillment, delivery, settlement, runtime, unknown), persisted as recovery cases, and tracked through immutable recovery attempts. The commerce execution worker records failures in a separate transaction so a rolled-back business transaction cannot erase the failure record. Successful execution resolves an open recovery case. Dead jobs create escalated recovery state rather than silently disappearing.

PostgreSQL migration 234 adds `trust_commerce_recovery_cases`, `trust_commerce_recovery_attempts`, and `trust_commerce_recovery_snapshot`. A protected operations API exposes the recovery surface.

Validation target: V409 audit/test/release gate plus migration continuity/checksum. Full TypeScript/build and live PostgreSQL remain environment-dependent and must not be represented as PASS without dependencies/database.
