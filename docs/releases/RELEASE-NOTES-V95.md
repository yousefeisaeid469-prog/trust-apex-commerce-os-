# TRUST V95 — Private Super Admin Control Plane

## Security focus
- `/admin` is server-gated and redirects unauthenticated users to `/admin-login`.
- Admin access uses a dedicated signed HTTP-only session cookie.
- Credentials are configured only through server environment variables.
- The public marketplace does not expose the Admin OS navigation link unless an authenticated admin session exists.
- Admin session endpoint supports login, status, and logout.
- Admin credentials are never embedded in client bundles.

## Important deployment requirement
Set `TRUST_ADMIN_EMAIL`, `TRUST_ADMIN_PASSWORD`, and a random `TRUST_ADMIN_SESSION_SECRET` (32+ characters) in the deployment environment. Do not put real values in Git.

This is a strong private-access gate for the current architecture. For multi-instance production, replace the environment-backed session with a durable identity provider/DB-backed admin identity and centralized revocation.
