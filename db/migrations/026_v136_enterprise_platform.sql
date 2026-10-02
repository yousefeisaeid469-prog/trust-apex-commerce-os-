-- TRUST V136 — enterprise platform primitives: policy, flags, API governance, webhooks, keys and backup evidence.
CREATE TABLE IF NOT EXISTS trust_tenant_memberships (
  tenant_id uuid NOT NULL REFERENCES trust_tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES trust_users(id) ON DELETE CASCADE,
  role text NOT NULL,
  status text NOT NULL CHECK(status IN ('active','suspended','revoked')) DEFAULT 'active',
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,user_id)
);
CREATE INDEX IF NOT EXISTS trust_tenant_memberships_user_idx ON trust_tenant_memberships(user_id,status);
CREATE TABLE IF NOT EXISTS trust_policy_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES trust_tenants(id) ON DELETE CASCADE,
  rule_key text NOT NULL,
  effect text NOT NULL CHECK(effect IN ('allow','deny')),
  actions text[] NOT NULL,
  roles text[] NOT NULL DEFAULT '{}',
  resource_types text[] NOT NULL DEFAULT '{}',
  same_tenant boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1 CHECK(version > 0),
  active boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,rule_key,version)
);
CREATE TABLE IF NOT EXISTS trust_feature_flags (
  tenant_id uuid REFERENCES trust_tenants(id) ON DELETE CASCADE,
  flag_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  rollout smallint NOT NULL DEFAULT 100 CHECK(rollout BETWEEN 0 AND 100),
  version integer NOT NULL DEFAULT 1 CHECK(version > 0),
  updated_by uuid REFERENCES trust_users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,flag_key)
);
CREATE TABLE IF NOT EXISTS trust_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES trust_tenants(id) ON DELETE CASCADE,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  sequence bigint,
  signature_verified boolean NOT NULL DEFAULT false,
  received_at timestamptz NOT NULL DEFAULT now(),
  occurred_at timestamptz NOT NULL,
  state text NOT NULL CHECK(state IN ('accepted','processing','processed','failed','dead_letter')) DEFAULT 'accepted',
  payload jsonb NOT NULL,
  UNIQUE(provider,tenant_id,provider_event_id)
);
CREATE INDEX IF NOT EXISTS trust_webhook_events_order_idx ON trust_webhook_events(tenant_id,provider,event_type,sequence);
CREATE TABLE IF NOT EXISTS trust_key_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES trust_tenants(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  state text NOT NULL CHECK(state IN ('active','rotating','revoked','expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  replaced_by uuid REFERENCES trust_key_metadata(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS trust_backup_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id text NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  status text NOT NULL CHECK(status IN ('started','passed','failed')),
  restored_objects bigint CHECK(restored_objects IS NULL OR restored_objects >= 0),
  checksum_verified boolean,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trust_backup_verifications_time_idx ON trust_backup_verifications(started_at DESC);
