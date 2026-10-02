-- V278: activate customer monetization + seller revenue surfaces. Append-only.
ALTER TABLE trust_marketplace_ad_campaigns ADD COLUMN IF NOT EXISTS objective text NOT NULL DEFAULT 'TRAFFIC';
ALTER TABLE trust_marketplace_customer_memberships ADD COLUMN IF NOT EXISTS renewal_attempts integer NOT NULL DEFAULT 0 CHECK(renewal_attempts>=0);
ALTER TABLE trust_marketplace_b2b_accounts ADD COLUMN IF NOT EXISTS approved_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_memberships_renewal ON trust_marketplace_customer_memberships(status,renews_at);
CREATE INDEX IF NOT EXISTS idx_b2b_status ON trust_marketplace_b2b_accounts(status,created_at DESC);
