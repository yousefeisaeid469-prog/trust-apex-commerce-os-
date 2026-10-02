# TRUST V263 — Reality Promotion Control Plane

V263 introduces an explicit promotion-control boundary between attested evidence and any future claim promotion.

Flow: `Attested Evidence → Explicit Decision → Promotion (future)`

The control plane creates four decision records bound to the V262 attestation root and exact evidence leaves. All decisions begin in `PENDING_EXPLICIT_REVIEW`; no reviewer is fabricated, and no automatic promotion is permitted. The decision root provides an integrity digest over the decision set.

V263 changes no database schema; migration 101 remains canonical.
