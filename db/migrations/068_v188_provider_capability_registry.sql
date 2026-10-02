-- V188 — provider capability registry, certification and live-readiness gates.
CREATE TABLE IF NOT EXISTS trust_provider_capabilities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provider text NOT NULL,
 adapter text NOT NULL,
 environment text NOT NULL CHECK(environment IN ('SANDBOX','LIVE')),
 capabilities_json jsonb NOT NULL,
 certification text NOT NULL CHECK(certification IN ('UNVERIFIED','PASSED','FAILED','EXPIRED')),
 health text NOT NULL CHECK(health IN ('UNKNOWN','HEALTHY','DEGRADED','DOWN')),
 certified_at timestamptz,
 expires_at timestamptz,
 last_health_check_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provider,environment)
);
CREATE INDEX IF NOT EXISTS idx_provider_capabilities_ready ON trust_provider_capabilities(provider,environment,certification,health);
