# TRUST V305 — Global Logistics Intelligence

V305 adds a deterministic logistics decision layer above the V304 carrier network. It combines carrier service cost, ETA bounds, and observed carrier reliability into a weighted route score. Priorities are BALANCED, COST, SPEED, and RELIABILITY.

The decision is persisted with candidate evidence and an idempotency key. OPEN carrier circuits are excluded. Costs are compared only after the runtime has matched the service currency to the requested checkout currency; this avoids silently comparing incompatible monetary units.

This release does not claim live DHL/FedEx/UPS execution or production optimization certification. The provider boundary remains explicit.
