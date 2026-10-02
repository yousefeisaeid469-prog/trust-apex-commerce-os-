# Global Payment V300

V300 turns the V299 global payment attempt into a durable execution lifecycle. The lifecycle is linked to the authoritative order, payment record, provider and provider reference.

## Lifecycle evidence
- CREATED
- PROVIDER_QUEUED
- PROVIDER_PROCESSING
- REQUIRES_ACTION
- AUTHORIZED
- CAPTURED
- FAILED
- CANCELLED
- PARTIALLY_REFUNDED
- REFUNDED

Provider execution still uses the existing adapter/job boundary. V300 does not claim a live connection to a specific payment company without configured credentials and endpoint evidence.
