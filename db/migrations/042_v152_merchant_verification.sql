-- V152 — Merchant Verification
-- Adds real document-backed merchant verification: national ID / commercial
-- registry submission, admin review workflow, and audit trail.
-- verification_status on trust_merchant_profiles already exists (pending/verified/rejected);
-- this migration adds the evidence + review layer that actually drives it.

CREATE TABLE IF NOT EXISTS trust_merchant_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES trust_merchant_profiles(id) ON DELETE CASCADE,
  legal_name text NOT NULL,
  national_id_number text NOT NULL,
  commercial_registry_number text,
  phone_number text NOT NULL,
  id_document_url text NOT NULL,
  registry_document_url text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','approved','rejected')),
  reviewer_email text,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trust_merchant_verification_merchant
  ON trust_merchant_verification_requests(merchant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trust_merchant_verification_status
  ON trust_merchant_verification_requests(status, created_at)
  WHERE status = 'submitted';

-- Only one active (submitted) request per merchant at a time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_trust_merchant_verification_one_pending
  ON trust_merchant_verification_requests(merchant_id)
  WHERE status = 'submitted';
