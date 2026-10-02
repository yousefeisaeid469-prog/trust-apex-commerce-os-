-- V216 — durable, evidence-gated revenue engine.
CREATE TABLE IF NOT EXISTS trust_revenue_ledger (
  event_id text PRIMARY KEY,
  tenant_id uuid,
  program_id text NOT NULL,
  surface text NOT NULL,
  source_id text NOT NULL,
  amount_minor bigint NOT NULL CHECK(amount_minor>=0),
  currency char(3) NOT NULL DEFAULT 'EGP',
  status text NOT NULL CHECK(status IN ('QUOTED','POSTED','VOID')),
  evidence_type text,
  evidence_id text,
  idempotency_key text NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_trust_revenue_ledger_idempotency ON trust_revenue_ledger(tenant_id,idempotency_key);
CREATE INDEX IF NOT EXISTS idx_trust_revenue_ledger_program_time ON trust_revenue_ledger(program_id,occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_revenue_ledger_status ON trust_revenue_ledger(status,created_at DESC);
