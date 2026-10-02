# TRUST V221 API Documentation

The generated OpenAPI route inventory is `docs/api/openapi-v1.json`. It inventories the current Next.js API surface and HTTP methods discovered from route handlers.

The inventory is intentionally conservative: generic success/error responses are placeholders where a domain-specific schema has not been formalized. Before publishing externally, add request/response schemas, auth scopes, rate limits and examples per endpoint.

Generate/check with:
- `npm run api-docs`
- `npm run api-docs-check`
