# Global Commerce Integration SDK Boundary

V121 exposes provider-neutral integration contracts for seller identity, inventory offers, cart splitting, cross-border quote providers, and reputation ingestion.

No provider credentials are embedded. Implementations should enforce idempotency, request signing, tenant isolation, and explicit currency/region boundaries.
