# V363 — Historical Failure Classification

The full historical suite is evidence, not the current-head release verdict.

## Current result
- Full historical suite: **739 passed / 38 failed / 777 total**.
- Current-head reality gate: **PASS**.
- Canonical migrations: **193, contiguous**.
- Version: **V363.0.0**.

## Classification

### A — Historical version-pinned contracts
These failures assert an old release number or old migration head and therefore cannot be used as the V363 verdict without rewriting the historical test.

- V230, V231, V232, V233
- V237 merchant/control-plane version assertions
- V249
- V255, V256, V258, V259, V261, V262, V263
- V292, V293
- V349, V350, V352, V354, V355, V356, V357, V358, V359

### B — Historical source-shape contracts that may need modernization
These tests inspect exact old source patterns rather than behavior. They should be converted to behavior/current-contract tests before being treated as release blockers.

- V199 transactional cancellation source shape
- V228/V229 feature-surface source-shape assertions
- V327 commerce-execution source-shape assertion
- V353 legacy-reservation source marker
- V272 selected-offer source binding assertion

### C — Historical reality/evidence tooling
The V251/V255–V264 family is a separate evidence/promotion framework. Its old manifests/configs are version-pinned and should not silently be rewritten to V363 just to make green. A future cleanup should either archive them as historical evidence or build a new V363 evidence contract.

- V251
- V255–V264

## Rule for future releases
A historical test is promoted to a current release blocker only when it proves a current runtime invariant, not merely an old version number, filename, source token, or release artifact.

The V363 release verdict is therefore the current-head gate, migration check, version-consistency check, local-import integrity check, and current smoke suite — not the raw historical count.
