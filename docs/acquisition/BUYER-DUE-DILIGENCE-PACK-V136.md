# TRUST V136 — Buyer Due-Diligence Pack

## Purpose
This document is the index for technical and operational diligence. It deliberately separates **implemented controls**, **automated evidence**, and **environment-dependent evidence**.

## Architecture
TRUST is organized around transactional commerce, durable jobs, payment state machines, trust/evidence/decision fabrics, tenant-aware enterprise controls, usage metering, billing state, observability and release governance.

## Security
Controls include authorization on sensitive Fabric routes, durable identity/session state, MFA, idempotency, webhook replay protection, request correlation and deterministic abuse classification. A third-party penetration test remains external evidence and is not represented as completed here.

## Financial integrity
Refund settlement is provider-confirmed; idempotency is request-bound; inventory cannot become negative at the database layer; usage events are tenant-scoped and idempotent.

## SLO
Core SLO targets are defined for API availability, checkout success, webhook processing and worker recovery. Actual production SLO attainment requires production telemetry over the stated measurement window.

## IP and licensing
The acquisition process should verify authorship, contributor assignments, third-party notices, package licenses, trademarks and domain ownership. This repository contains an inventory framework but does not substitute for legal counsel or executed assignment documents.

## Evidence
Release gates, migration manifests, source audits, parity checks, contract checks, failure harnesses and security-abuse tests are designed to be reproducible from the repository.

## Known limitations
No repository-only audit can prove production traffic, real payment-provider settlement, disaster recovery restoration, customer retention, revenue, or security against all real-world adversaries. Those require independent environment and business evidence.

## Acquisition signal
A buyer should evaluate the asset on defensibility, working production deployment, customer traction, recurring revenue, retention, unit economics, IP cleanliness and operational maturity—not source-file count.
