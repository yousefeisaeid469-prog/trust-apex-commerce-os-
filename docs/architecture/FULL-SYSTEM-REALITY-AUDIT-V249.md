# TRUST V249.0.0 — Full-System Reality Audit

V249 introduces a machine-generated reality report that classifies production claims by executable evidence rather than documentation alone.

## Evidence model

Every claim is evaluated against:

1. implementation artifacts;
2. runtime evidence markers;
3. regression tests;
4. release documentation references.

## Statuses

- **PROVEN** — executable evidence chain is complete and documented.
- **PARTIAL** — some evidence exists but the chain is incomplete.
- **DOCUMENTED_ONLY** — documentation makes the claim without a complete executable chain.
- **UNWIRED** — declared artifacts exist but runtime markers are not actually wired.
- **STALE** — executable evidence exists but current release documentation no longer references the claim.
- **CONTRADICTED** — implementation contains explicit negative markers such as not-wired/not-implemented statements.

Strict mode blocks releases on `UNWIRED` and `CONTRADICTED`; weaker statuses remain visible as remediation work instead of being silently promoted to production proof.

The report is generated at `artifacts/reality/full-system-reality-report.json` and `.md`.
