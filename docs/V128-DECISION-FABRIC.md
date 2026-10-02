# TRUST V128 — Evidence & Decision Fabric

V128 introduces a cross-domain decision-governance layer. Instead of each module independently deciding what is safe, the fabric standardizes evidence provenance, contradiction handling, confidence, risk, reversibility and human-review gates.

## Core contracts
- Evidence records with source, timestamp, status, confidence and claim.
- Decision requests and deterministic evaluation.
- Unknown data remains unknown.
- Contradictions escalate rather than being averaged away.
- High-impact actions require review.
- Financial autonomous actions remain disabled by default.

## Why this matters
This becomes a backbone for Protection, Prevention, Personal Shopper, Discovery, Merchant Supergraph, Payments, Logistics, Agents and future domains. It is intentionally provider-neutral.

## Production boundary
The included engine is a deterministic governance foundation. A production deployment needs durable evidence ingestion, provider attestations, event streaming, policy versioning, cryptographic provenance where appropriate, retention controls and independent audit/observability.
