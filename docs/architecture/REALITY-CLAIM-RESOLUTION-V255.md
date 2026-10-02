# TRUST V255 — Reality Claim Resolution

V255 adds a semantic boundary between documentation discovery and evidence promotion.

The resolver reads the V254 authoring queue and classifies records into:

- **CAPABILITY_CLAIM** — a positive product/runtime assertion that may become a structured claim after explicit authoring.
- **LIMITATION_STATEMENT** — a prerequisite, boundary, disclaimer, or explicit non-claim. It is not a missing capability and cannot be promoted as one.
- **RELEASE_TITLE** — release metadata, not evidence.
- **VERIFICATION_STATEMENT** — narrative about verification rather than a capability contract.

For capability claims, the resolver produces implementation, runtime-marker, and regression-test **candidates**. Candidate discovery is intentionally non-authoritative: lexical matches never become evidence automatically.

## Result

The V255 resolver currently separates the V254 queue into:

- 58 capability records requiring explicit evidence authoring;
- 24 limitation/non-claim records;
- 13 release-title records;
- 1 verification-narrative record.

No record is auto-promoted. Promotion remains governed by the structured evidence contract from V253.

## Why this matters

The earlier `DOCUMENTED_ONLY` bucket mixed real capability assertions with deliberate production caveats and release metadata. Treating all of those as missing implementation would create false remediation work and could encourage unsafe overclaiming. V255 makes that distinction machine-readable and testable.
