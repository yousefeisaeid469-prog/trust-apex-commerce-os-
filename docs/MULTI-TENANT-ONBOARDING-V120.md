# Multi-Tenant Merchant Onboarding

Lifecycle:
REGISTERED → IDENTITY_VERIFIED → PAYMENT_CONNECTED → INVENTORY_CONNECTED → STORE_PUBLISHED → ACTIVE

Each transition is monotonic and should be persisted transactionally in production. The current route provides the workflow contract; production persistence must use the tenant database and idempotent workflow/job primitives already present in Platform OS.
