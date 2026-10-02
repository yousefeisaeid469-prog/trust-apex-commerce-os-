# V363.0.0 — ORCHESTRATION RUNTIME CONTRACT

## Implemented
- Restored the durable autonomous-orchestrator consumer runtime.
- Added durable completion/status API at `/api/autonomous-commerce-orchestrator`.
- Connected durable acceptance to the canonical durable event append path.
- Added settlement-currency and locale assertions to the V297 global registry.
- Fixed Node/TypeScript runtime resolution for the V301 fulfillment bridge.
- Added orchestration status indexes in migration 193.

## Historical test policy
The full historical suite remains intentionally non-authoritative for current-head version identity. Tests pinned to V199/V230–V233/V237/V249/V255–V264/V292/V293/V349–V359 are retained as historical regression evidence and are not used as the V363 release verdict.
