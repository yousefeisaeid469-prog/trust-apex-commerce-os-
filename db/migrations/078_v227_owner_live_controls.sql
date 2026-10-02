-- V227 — durable owner live controls. A single row makes emergency state explicit and auditable.
CREATE TABLE IF NOT EXISTS trust_owner_live_control_state (
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton=true),
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  global_freeze BOOLEAN NOT NULL DEFAULT false,
  autonomy_kill_switch BOOLEAN NOT NULL DEFAULT false,
  version BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_email TEXT,
  reason TEXT
);
INSERT INTO trust_owner_live_control_state(singleton) VALUES(true) ON CONFLICT (singleton) DO NOTHING;
