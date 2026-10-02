# Owner Control Room Operations V227

1. Configure `TRUST_OWNER_EMAILS` with the exact owner email(s).
2. Configure PostgreSQL and run migrations through migration 078.
3. Open `/owner-control-room` only after owner authentication is available.
4. Use Maintenance Mode for controlled maintenance, Global Freeze for incident containment, and Autonomy Kill Switch to stop autonomous execution intent at the control-plane boundary.
5. Review the immutable owner audit after every high-impact action.
6. Treat the controls as control-plane state until the corresponding domain enforcement is verified in deployment.

Never treat a hidden URL as authorization. Never claim provider-side failover, refund, payment, or fulfillment actions from this room unless a real adapter reports success.
