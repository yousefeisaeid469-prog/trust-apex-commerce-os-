# Database migrations

Apply SQL migrations in filename order against the production PostgreSQL database.
Do not run migrations automatically during a web request. Run them as a deployment step with a dedicated migration identity.

V84 adds uniqueness constraints for idempotency/payment-event replay protection and indexes for high-volume operational queries.
