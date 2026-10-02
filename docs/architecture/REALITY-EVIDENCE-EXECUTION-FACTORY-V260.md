# TRUST V260 — Reality Evidence Execution Factory

V260 turns the V257 capability contracts and V258 forensic resolution into explicit execution packets.

The factory deliberately separates **discovery** from **authoritative evidence**. Candidate artifacts, lexical runtime matches, and candidate tests are retained as discovery-only hints and are never copied into the authoritative evidence slots.

## Packet contract

Every capability receives a deterministic evidence packet containing:

- implementation artifact slots;
- exact runtime marker/entrypoint slots;
- executable regression-test slots;
- failure condition;
- execution state and required sequence;
- discovery-only candidates;
- integrity digests for the contract and current evidence payload.

## Safety invariant

All 58 packets remain `BLOCKED_PENDING_EXPLICIT_EVIDENCE` in V260. This is intentional. The factory does not invent evidence, execute unverified candidates, issue receipts for incomplete packets, or bypass the existing promotion gate.

## Execution pipeline

`AUTHOR → VALIDATE → EXECUTE → RECEIPT → PROMOTION REQUEST`

A later release may populate an individual packet only with evidence that has been explicitly reviewed and is executable. A packet becomes eligible only when all authoritative evidence fields are complete.
