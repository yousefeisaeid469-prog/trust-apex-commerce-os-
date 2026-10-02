-- V237 Merchant Commerce Control Plane
-- Durable merchant operating state: onboarding, catalog, inventory, pricing, promotions,
-- payouts, tax, staff, procurement, channels, billing, risk, compliance, support,
-- automation, forecasting, reconciliation and control-room evidence.

CREATE TABLE IF NOT EXISTS trust_merchant_operating_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'ACTIVE', risk_status text NOT NULL DEFAULT 'CLEAR',
  default_currency text NOT NULL DEFAULT 'EGP', timezone text NOT NULL DEFAULT 'Africa/Cairo',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id)
);
CREATE INDEX IF NOT EXISTS idx_merchant_operating_accounts_risk ON trust_merchant_operating_accounts(risk_status,updated_at DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_commerce_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  record_type text NOT NULL, record_key text NOT NULL, status text NOT NULL,
  amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(amount>=0), quantity numeric(18,4) NOT NULL DEFAULT 0 CHECK(quantity>=0),
  score numeric(8,2) NOT NULL DEFAULT 0 CHECK(score>=0 AND score<=100),
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(merchant_id,record_type,record_key)
);
CREATE INDEX IF NOT EXISTS idx_merchant_commerce_records_lookup ON trust_merchant_commerce_records(merchant_id,record_type,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_merchant_commerce_records_score ON trust_merchant_commerce_records(merchant_id,score DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_operating_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  actor_id uuid, event_type text NOT NULL, aggregate_type text NOT NULL, aggregate_id text NOT NULL,
  fingerprint text NOT NULL, payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(fingerprint)
);
CREATE INDEX IF NOT EXISTS idx_merchant_operating_events_aggregate ON trust_merchant_operating_events(merchant_id,aggregate_type,aggregate_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_merchant_operating_events_type ON trust_merchant_operating_events(merchant_id,event_type,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_onboarding_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'DRAFT', checklist_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewer_id uuid, submitted_at timestamptz, approved_at timestamptz, rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_merchant_onboarding_status ON trust_merchant_onboarding_cases(status,updated_at);

CREATE TABLE IF NOT EXISTS trust_merchant_catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  sku text NOT NULL, title text NOT NULL, description text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'DRAFT',
  price numeric(18,2) NOT NULL DEFAULT 0 CHECK(price>=0), cost numeric(18,2) NOT NULL DEFAULT 0 CHECK(cost>=0),
  currency text NOT NULL DEFAULT 'EGP', attributes_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(merchant_id,sku)
);
CREATE INDEX IF NOT EXISTS idx_merchant_catalog_status ON trust_merchant_catalog_items(merchant_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_merchant_catalog_title ON trust_merchant_catalog_items USING gin(to_tsvector('simple',title));

CREATE TABLE IF NOT EXISTS trust_merchant_catalog_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), item_id uuid NOT NULL REFERENCES trust_merchant_catalog_items(id) ON DELETE CASCADE,
  channel text NOT NULL, status text NOT NULL DEFAULT 'PENDING', external_reference text,
  version bigint NOT NULL DEFAULT 1, error_code text, published_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id,channel)
);
CREATE INDEX IF NOT EXISTS idx_merchant_catalog_publications_channel ON trust_merchant_catalog_publications(channel,status,updated_at);

CREATE TABLE IF NOT EXISTS trust_merchant_inventory_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  sku text NOT NULL, warehouse_code text NOT NULL DEFAULT 'DEFAULT', on_hand numeric(18,4) NOT NULL DEFAULT 0 CHECK(on_hand>=0),
  reserved numeric(18,4) NOT NULL DEFAULT 0 CHECK(reserved>=0), damaged numeric(18,4) NOT NULL DEFAULT 0 CHECK(damaged>=0),
  reorder_point numeric(18,4) NOT NULL DEFAULT 0 CHECK(reorder_point>=0), version bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(merchant_id,sku,warehouse_code)
);
CREATE INDEX IF NOT EXISTS idx_merchant_inventory_available ON trust_merchant_inventory_balances(merchant_id,(on_hand-reserved),updated_at DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  sku text NOT NULL, warehouse_code text NOT NULL, movement_type text NOT NULL, quantity numeric(18,4) NOT NULL CHECK(quantity<>0),
  reference_type text, reference_id text, idempotency_key text NOT NULL, actor_id uuid, metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_merchant_inventory_movements_sku ON trust_merchant_inventory_movements(merchant_id,sku,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_inventory_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  sku text NOT NULL, warehouse_code text NOT NULL, reference_type text NOT NULL, reference_id text NOT NULL,
  quantity numeric(18,4) NOT NULL CHECK(quantity>0), status text NOT NULL DEFAULT 'RESERVED', expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), released_at timestamptz,
  UNIQUE(merchant_id,reference_type,reference_id,sku,warehouse_code)
);
CREATE INDEX IF NOT EXISTS idx_merchant_inventory_reservations_expiry ON trust_merchant_inventory_reservations(status,expires_at);

CREATE TABLE IF NOT EXISTS trust_merchant_price_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  name text NOT NULL, currency text NOT NULL DEFAULT 'EGP', status text NOT NULL DEFAULT 'DRAFT', priority integer NOT NULL DEFAULT 0,
  effective_from timestamptz, effective_to timestamptz, rules_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_merchant_price_books_active ON trust_merchant_price_books(merchant_id,status,effective_from,effective_to,priority DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_price_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), price_book_id uuid NOT NULL REFERENCES trust_merchant_price_books(id) ON DELETE CASCADE,
  sku text NOT NULL, base_price numeric(18,2) NOT NULL CHECK(base_price>=0), floor_price numeric(18,2) NOT NULL DEFAULT 0 CHECK(floor_price>=0),
  ceiling_price numeric(18,2), adjustment_type text NOT NULL DEFAULT 'FIXED', adjustment_value numeric(18,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(price_book_id,sku)
);
CREATE INDEX IF NOT EXISTS idx_merchant_price_rules_sku ON trust_merchant_price_rules(price_book_id,sku);

CREATE TABLE IF NOT EXISTS trust_merchant_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  code text, name text NOT NULL, status text NOT NULL DEFAULT 'DRAFT', promotion_type text NOT NULL,
  starts_at timestamptz, ends_at timestamptz, budget numeric(18,2) NOT NULL DEFAULT 0 CHECK(budget>=0), spent numeric(18,2) NOT NULL DEFAULT 0 CHECK(spent>=0),
  rules_json jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,code)
);
CREATE INDEX IF NOT EXISTS idx_merchant_promotions_active ON trust_merchant_promotions(merchant_id,status,starts_at,ends_at);

CREATE TABLE IF NOT EXISTS trust_merchant_promotion_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), promotion_id uuid NOT NULL REFERENCES trust_merchant_promotions(id) ON DELETE CASCADE,
  customer_id uuid, order_id uuid, amount numeric(18,2) NOT NULL CHECK(amount>=0), fingerprint text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(fingerprint)
);
CREATE INDEX IF NOT EXISTS idx_merchant_promotion_redemptions_promo ON trust_merchant_promotion_redemptions(promotion_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_payout_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  provider text NOT NULL, external_account_ref text, status text NOT NULL DEFAULT 'PENDING', currency text NOT NULL DEFAULT 'EGP',
  capabilities_json jsonb NOT NULL DEFAULT '{}'::jsonb, last_verified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,provider)
);
CREATE TABLE IF NOT EXISTS trust_merchant_payout_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  payout_account_id uuid REFERENCES trust_merchant_payout_accounts(id), entry_type text NOT NULL, reference_type text NOT NULL, reference_id text NOT NULL,
  amount numeric(18,2) NOT NULL CHECK(amount<>0), currency text NOT NULL DEFAULT 'EGP', fingerprint text NOT NULL, metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,fingerprint)
);
CREATE INDEX IF NOT EXISTS idx_merchant_payout_ledger_ref ON trust_merchant_payout_ledger(merchant_id,reference_type,reference_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_payout_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING', gross_amount numeric(18,2) NOT NULL DEFAULT 0, fees numeric(18,2) NOT NULL DEFAULT 0, net_amount numeric(18,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EGP', provider_reference text, idempotency_key text NOT NULL, attempted_at timestamptz, completed_at timestamptz,
  error_code text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_merchant_payout_runs_status ON trust_merchant_payout_runs(merchant_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_tax_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  country_code text NOT NULL DEFAULT 'EG', tax_id text, regime text NOT NULL DEFAULT 'REVIEW', default_rate numeric(8,4) NOT NULL DEFAULT 0 CHECK(default_rate>=0),
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb, verified_at timestamptz, expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id)
);
CREATE TABLE IF NOT EXISTS trust_merchant_tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  jurisdiction text NOT NULL, category_code text NOT NULL, rate numeric(8,4) NOT NULL CHECK(rate>=0), inclusive boolean NOT NULL DEFAULT false,
  effective_from timestamptz NOT NULL DEFAULT now(), effective_to timestamptz, evidence_ref text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,jurisdiction,category_code,effective_from)
);
CREATE INDEX IF NOT EXISTS idx_merchant_tax_rules_lookup ON trust_merchant_tax_rules(merchant_id,jurisdiction,category_code,effective_from DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, status text NOT NULL DEFAULT 'INVITED', title text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,user_id)
);
CREATE TABLE IF NOT EXISTS trust_merchant_staff_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), staff_id uuid NOT NULL REFERENCES trust_merchant_staff_members(id) ON DELETE CASCADE,
  permission text NOT NULL, scope_json jsonb NOT NULL DEFAULT '{}'::jsonb, granted_by uuid, expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(staff_id,permission)
);
CREATE INDEX IF NOT EXISTS idx_merchant_staff_grants_permission ON trust_merchant_staff_grants(permission,expires_at);

CREATE TABLE IF NOT EXISTS trust_merchant_procurement_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  vendor_code text NOT NULL, name text NOT NULL, status text NOT NULL DEFAULT 'ACTIVE', lead_days integer NOT NULL DEFAULT 0 CHECK(lead_days>=0),
  terms_json jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,vendor_code)
);
CREATE TABLE IF NOT EXISTS trust_merchant_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES trust_merchant_procurement_vendors(id), order_number text NOT NULL, status text NOT NULL DEFAULT 'DRAFT',
  currency text NOT NULL DEFAULT 'EGP', total_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(total_amount>=0), expected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,order_number)
);
CREATE TABLE IF NOT EXISTS trust_merchant_purchase_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), purchase_order_id uuid NOT NULL REFERENCES trust_merchant_purchase_orders(id) ON DELETE CASCADE,
  sku text NOT NULL, ordered_qty numeric(18,4) NOT NULL CHECK(ordered_qty>0), received_qty numeric(18,4) NOT NULL DEFAULT 0 CHECK(received_qty>=0), unit_cost numeric(18,2) NOT NULL CHECK(unit_cost>=0),
  UNIQUE(purchase_order_id,sku)
);
CREATE INDEX IF NOT EXISTS idx_merchant_purchase_orders_vendor ON trust_merchant_purchase_orders(vendor_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  channel text NOT NULL, status text NOT NULL DEFAULT 'DISCONNECTED', provider text, external_store_ref text, capabilities_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at timestamptz, last_error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,channel)
);
CREATE TABLE IF NOT EXISTS trust_merchant_channel_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), channel_id uuid NOT NULL REFERENCES trust_merchant_channels(id) ON DELETE CASCADE,
  direction text NOT NULL, status text NOT NULL DEFAULT 'PENDING', cursor text, attempt integer NOT NULL DEFAULT 0, lease_until timestamptz, next_run_at timestamptz NOT NULL DEFAULT now(),
  error_code text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_merchant_channel_sync_jobs_ready ON trust_merchant_channel_sync_jobs(status,next_run_at,lease_until);

CREATE TABLE IF NOT EXISTS trust_merchant_billing_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'OPEN', currency text NOT NULL DEFAULT 'EGP', credit_limit numeric(18,2) NOT NULL DEFAULT 0 CHECK(credit_limit>=0), balance numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id)
);
CREATE TABLE IF NOT EXISTS trust_merchant_billing_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), billing_account_id uuid NOT NULL REFERENCES trust_merchant_billing_accounts(id) ON DELETE CASCADE,
  entry_type text NOT NULL, reference_type text NOT NULL, reference_id text NOT NULL, amount numeric(18,2) NOT NULL CHECK(amount<>0), fingerprint text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(billing_account_id,fingerprint)
);
CREATE INDEX IF NOT EXISTS idx_merchant_billing_entries_reference ON trust_merchant_billing_entries(billing_account_id,reference_type,reference_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'CLEAR', score numeric(8,2) NOT NULL DEFAULT 0 CHECK(score>=0 AND score<=100), model_version text NOT NULL DEFAULT 'deterministic-v1',
  signals_json jsonb NOT NULL DEFAULT '[]'::jsonb, decision text NOT NULL DEFAULT 'ALLOW', reviewed_by uuid, reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_merchant_risk_latest ON trust_merchant_risk_assessments(merchant_id,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_compliance_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  requirement_code text NOT NULL, status text NOT NULL DEFAULT 'MISSING', evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb, expires_at timestamptz, reviewed_by uuid, reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,requirement_code)
);
CREATE INDEX IF NOT EXISTS idx_merchant_compliance_expiry ON trust_merchant_compliance_cases(status,expires_at);

CREATE TABLE IF NOT EXISTS trust_merchant_support_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  case_number text NOT NULL, status text NOT NULL DEFAULT 'OPEN', priority text NOT NULL DEFAULT 'NORMAL', category text NOT NULL,
  subject text NOT NULL, description text NOT NULL DEFAULT '', assigned_to uuid, due_at timestamptz, resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,case_number)
);
CREATE TABLE IF NOT EXISTS trust_merchant_support_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES trust_merchant_support_cases(id) ON DELETE CASCADE,
  actor_id uuid, event_type text NOT NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_merchant_support_cases_sla ON trust_merchant_support_cases(status,priority,due_at);

CREATE TABLE IF NOT EXISTS trust_merchant_automation_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  key text NOT NULL, status text NOT NULL DEFAULT 'DISABLED', trigger_type text NOT NULL, definition_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  max_attempts integer NOT NULL DEFAULT 5 CHECK(max_attempts>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,key)
);
CREATE TABLE IF NOT EXISTS trust_merchant_automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workflow_id uuid NOT NULL REFERENCES trust_merchant_automation_workflows(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'READY', attempt integer NOT NULL DEFAULT 0, idempotency_key text NOT NULL, payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  lease_until timestamptz, next_run_at timestamptz NOT NULL DEFAULT now(), last_error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(workflow_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_merchant_automation_ready ON trust_merchant_automation_runs(status,next_run_at,lease_until);

CREATE TABLE IF NOT EXISTS trust_merchant_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  sku text, horizon_days integer NOT NULL CHECK(horizon_days>0), status text NOT NULL DEFAULT 'DRAFT', model_version text NOT NULL DEFAULT 'deterministic-v1',
  baseline numeric(18,4) NOT NULL DEFAULT 0, forecast_json jsonb NOT NULL DEFAULT '{}'::jsonb, generated_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_merchant_forecasts_lookup ON trust_merchant_forecasts(merchant_id,sku,status,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_reconciliation_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  case_type text NOT NULL, status text NOT NULL DEFAULT 'OPEN', severity text NOT NULL DEFAULT 'MEDIUM', reference_type text NOT NULL, reference_id text NOT NULL,
  expected_amount numeric(18,2) NOT NULL DEFAULT 0, observed_amount numeric(18,2) NOT NULL DEFAULT 0, delta_amount numeric(18,2) NOT NULL DEFAULT 0,
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb, assigned_to uuid, resolved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_merchant_reconciliation_open ON trust_merchant_reconciliation_cases(merchant_id,status,severity,updated_at DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_control_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  alert_type text NOT NULL, severity text NOT NULL, title text NOT NULL, detail text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'OPEN',
  dedupe_key text NOT NULL, acknowledged_by uuid, acknowledged_at timestamptz, resolved_by uuid, resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,dedupe_key)
);
CREATE INDEX IF NOT EXISTS idx_merchant_control_alerts_open ON trust_merchant_control_alerts(merchant_id,status,severity,created_at DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_control_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  health_score numeric(8,2) NOT NULL DEFAULT 0 CHECK(health_score>=0 AND health_score<=100), metrics_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(merchant_id,generated_at)
);
CREATE INDEX IF NOT EXISTS idx_merchant_control_snapshots_latest ON trust_merchant_control_snapshots(merchant_id,generated_at DESC);

CREATE TABLE IF NOT EXISTS trust_merchant_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  decision_type text NOT NULL, status text NOT NULL DEFAULT 'PROPOSED', priority text NOT NULL DEFAULT 'NORMAL',
  rationale_json jsonb NOT NULL DEFAULT '{}'::jsonb, proposed_action text NOT NULL, actor_id uuid, approved_by uuid, approved_at timestamptz,
  executed_at timestamptz, outcome_json jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_merchant_decisions_queue ON trust_merchant_decisions(merchant_id,status,priority,created_at DESC);

-- Operational helper indexes for common ownership and queue patterns.
CREATE INDEX IF NOT EXISTS idx_merchant_catalog_items_ownership ON trust_merchant_catalog_items(merchant_id,id);
CREATE INDEX IF NOT EXISTS idx_merchant_inventory_balances_ownership ON trust_merchant_inventory_balances(merchant_id,id);
CREATE INDEX IF NOT EXISTS idx_merchant_payout_runs_ownership ON trust_merchant_payout_runs(merchant_id,id);
CREATE INDEX IF NOT EXISTS idx_merchant_staff_members_ownership ON trust_merchant_staff_members(merchant_id,id);
CREATE INDEX IF NOT EXISTS idx_merchant_channels_ownership ON trust_merchant_channels(merchant_id,id);
CREATE INDEX IF NOT EXISTS idx_merchant_support_cases_ownership ON trust_merchant_support_cases(merchant_id,id);
CREATE INDEX IF NOT EXISTS idx_merchant_automation_workflows_ownership ON trust_merchant_automation_workflows(merchant_id,id);
CREATE INDEX IF NOT EXISTS idx_merchant_forecasts_ownership ON trust_merchant_forecasts(merchant_id,id);
CREATE INDEX IF NOT EXISTS idx_merchant_control_alerts_ownership ON trust_merchant_control_alerts(merchant_id,id);

COMMENT ON TABLE trust_merchant_commerce_records IS 'Generic merchant aggregate index for operational projections; canonical business state remains in its domain tables.';
COMMENT ON TABLE trust_merchant_operating_events IS 'Durable merchant event evidence with fingerprint-based deduplication.';
COMMENT ON TABLE trust_merchant_control_snapshots IS 'Immutable point-in-time merchant health snapshots used by the control room.';
