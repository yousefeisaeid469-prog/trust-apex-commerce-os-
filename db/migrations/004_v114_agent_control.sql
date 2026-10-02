-- TRUST V114 — durable control-plane foundation
CREATE TABLE IF NOT EXISTS trust_agent_policies (
 agent_id TEXT PRIMARY KEY, state TEXT NOT NULL CHECK (state IN ('RUNNING','PAUSED','KILLED')),
 allowed_tools JSONB NOT NULL DEFAULT '[]'::jsonb, max_risk TEXT NOT NULL,
 approval_for JSONB NOT NULL DEFAULT '[]'::jsonb, rate_limit_per_minute INTEGER NOT NULL CHECK (rate_limit_per_minute > 0),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trust_agent_messages (
 id UUID PRIMARY KEY, from_agent TEXT NOT NULL, to_agent TEXT NOT NULL,
 message_type TEXT NOT NULL CHECK (message_type IN ('REQUEST','RESULT','ESCALATION')),
 task TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trust_agent_messages_route ON trust_agent_messages(from_agent,to_agent,created_at DESC);
CREATE TABLE IF NOT EXISTS trust_agent_approvals (
 id TEXT PRIMARY KEY, state TEXT NOT NULL CHECK (state IN ('NOT_REQUIRED','PENDING','APPROVED','REJECTED')),
 resolved_at TIMESTAMPTZ, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
