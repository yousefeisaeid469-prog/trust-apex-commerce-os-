# V236 Customer Data Platform

This layer turns customer experience into a durable operational domain. It contains an event ledger, deterministic segmentation, consent evaluation, customer search/context, journey execution, analytics, quality policies and maintenance diagnostics.

## Data ownership
Customer profile and customer-owned state live in PostgreSQL. Search, scoring and UI are projections over that state. They are not alternate sources of truth.

## Safety of automation
Automated journeys can only use channels allowed by the consent engine. Segment membership is recomputable and carries evaluation scores. Event ingestion is fingerprinted to prevent accidental duplicates.

## Operations
Segment rebuilds, privacy jobs and retention maintenance are operator-gated.
