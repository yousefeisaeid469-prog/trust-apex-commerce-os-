# Owner Control Room Operations — V226

Set `TRUST_OWNER_EMAILS` to a comma-separated allowlist of the exact owner email(s). Keep `TRUST_ADMIN_SESSION_SECRET` strong and enable admin MFA in production where supported.

The room must be treated as a high-impact administrative surface. Protect owner credentials, review approval-gated requests, and verify external infrastructure evidence before declaring failover, provider success, financial movement or autonomous execution complete.
