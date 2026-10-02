# TRUST V262 — Reality Evidence Attestation

V262 adds a drift sentinel around the V261 executable evidence batch. The attestation re-hashes every source-pinned implementation artifact and replays every declared regression test. A mismatch produces `DRIFT_DETECTED` and the command fails closed.

The attestation root is a deterministic SHA-256 digest over the sorted evidence leaves. It is an integrity signal, not a deployment or production-certification claim.

Promotion remains outside this mechanism and is always `0` unless a separate explicit governance decision is introduced.
