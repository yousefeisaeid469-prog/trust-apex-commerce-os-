# Merchant Control Plane API

`GET` returns a durable merchant snapshot, open control alerts, and merchant commerce records.
`POST` supports record upserts, alert creation, and explicit snapshot generation.

All requests are authenticated through the current session and scoped to the merchant attached to that user.
The route never reports a provider-dependent operation as live; external channel, payout, tax, and shipping integrations remain provider-gated until configured.
