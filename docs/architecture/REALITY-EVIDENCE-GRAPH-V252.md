# TRUST V252 — Reality Evidence Graph

V252 adds an executable remediation graph for claims that the V249/V251 reality audit can see in documentation but cannot yet certify as evidence-backed.

The graph links each DOCUMENTED_ONLY record to conservative candidate implementation artifacts. Candidate matching is deliberately non-authoritative: a candidate is not promoted to PROVEN until an executable runtime marker and regression test are explicitly attached.

## Guardrails

- No schema change is introduced by V252.
- DOCUMENTED_ONLY is not treated as fake or contradictory.
- Lexical candidate matching never becomes production evidence by itself.
- The generated graph is checked into `artifacts/reality/` and covered by a regression test.
