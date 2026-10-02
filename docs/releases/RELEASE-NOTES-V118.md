# TRUST V118 — AI Shopping Concierge + Visual Intelligence

V118 turns discovery into a conversational decision layer.

## Consumer
- AI Shopping Concierge / Shopping Mission.
- Explainable recommendations with confidence and reasons.
- Clarifying questions and explicit guardrails.
- Visual Search UX with a provider boundary; no fabricated similarity results.

## Private admin
- `/discovery/admin` is server-gated and exposes governance-oriented discovery telemetry placeholders until durable analytics is connected.

## Data
- `009_v118_ai_discovery.sql` adds missions, discovery events, and vision search audit records.

## Production boundary
The concierge engine is deterministic scaffolding, not a trained foundation model. Real catalog retrieval, ranking, LLM orchestration, image embeddings, vector search, and live price/inventory/delivery data must be connected to production providers before claims of live AI shopping intelligence are made.
