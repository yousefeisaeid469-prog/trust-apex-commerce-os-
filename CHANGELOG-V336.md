# V336 — Payment Webhook Money Integrity

- Provider webhooks now validate reported amount/currency against the stored payment when those fields are present.
- Payment row remains the server-authoritative amount/currency source.
- Mismatched authenticated webhook money is rejected before payment state changes.
- Added regression coverage for matching, mismatch, invalid and omitted provider money fields.
