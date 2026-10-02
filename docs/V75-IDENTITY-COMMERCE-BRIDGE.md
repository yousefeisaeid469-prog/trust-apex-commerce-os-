# V75 Identity → Commerce Bridge

The key production rule introduced in V75 is: **never trust `customerId` supplied by the browser for authenticated commerce actions.**

1. The request carries an HTTP-only `trust_session` cookie.
2. The server resolves the session to a `UserAccount`.
3. Order creation uses `user.id` from that server-side identity.
4. Order reads are scoped to the authenticated customer unless RBAC grants operational access.
5. Order state mutation requires `orders:operate`.

This boundary is deliberately independent of the storage implementation so the in-memory development store can later be replaced by PostgreSQL without changing API authorization semantics.
