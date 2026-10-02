# TRUST V96 — Private Command Center Hardening

- Server-gated `/admin` remains inaccessible without a valid admin session.
- Optional RFC 6238 TOTP MFA via `TRUST_ADMIN_REQUIRE_MFA=true` and a Base32 `TRUST_ADMIN_TOTP_SECRET`.
- Login attempt throttling to reduce password-guessing abuse.
- Admin control API is independently authenticated server-side.
- Control modes: normal, safe, readonly, emergency.
- Admin session includes a random nonce and signed claims.
- Security response headers added globally.
- `/admin-login` is marked noindex.
- No operational admin data is exposed to anonymous visitors.

## Production requirements

Set `TRUST_ADMIN_EMAIL`, `TRUST_ADMIN_PASSWORD`, and a random `TRUST_ADMIN_SESSION_SECRET` (32+ chars). For MFA, set `TRUST_ADMIN_REQUIRE_MFA=true` and provision `TRUST_ADMIN_TOTP_SECRET` as a Base32 TOTP secret. Never commit real values to Git.
