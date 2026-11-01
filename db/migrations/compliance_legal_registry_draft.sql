-- PAMIZE Compliance Guardian: proposed PostgreSQL schema.
-- IMPORTANT: not applied to any environment; review tenant RLS and roles before running.
BEGIN;

CREATE TABLE IF NOT EXISTS compliance_legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id text NOT NULL,
  document_id text NOT NULL UNIQUE,
  title text NOT NULL,
  jurisdiction text NOT NULL CHECK (jurisdiction IN ('EU','PL')),
  official_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_legal_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_document_id uuid NOT NULL REFERENCES compliance_legal_documents(id),
  version_key text NOT NULL,
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[a-f0-9]{64}$'),
  retrieved_at timestamptz NOT NULL,
  published_on date,
  effective_on date,
  applicable_from date,
  legal_status text NOT NULL DEFAULT 'unverified'
    CHECK (legal_status IN ('draft','published','effective','amended','repealed','unverified')),
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','rejected')),
  verified_by text,
  verified_at timestamptz,
  source_etag text,
  source_last_modified text,
  raw_storage_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(legal_document_id, version_key),
  CHECK (verification_status <> 'verified' OR (verified_by IS NOT NULL AND verified_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS compliance_versions_document_retrieved_idx
  ON compliance_legal_versions (legal_document_id, retrieved_at DESC);

CREATE TABLE IF NOT EXISTS compliance_legal_sections (
  version_id uuid NOT NULL REFERENCES compliance_legal_versions(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  section_text text NOT NULL,
  PRIMARY KEY (version_id, section_key)
);

CREATE TABLE IF NOT EXISTS compliance_change_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_document_id uuid NOT NULL REFERENCES compliance_legal_documents(id),
  old_version_id uuid REFERENCES compliance_legal_versions(id),
  new_version_id uuid NOT NULL REFERENCES compliance_legal_versions(id),
  review_status text NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending','in_review','approved','rejected')),
  change_summary text,
  legal_impact text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (old_version_id, new_version_id)
);

-- These tables contain cross-tenant public regulatory material only.
-- Customer-specific impacts, procedures and agent mappings require separate tenant-scoped tables + RLS.
-- No public/anonymous INSERT, UPDATE or DELETE privileges should be granted.
COMMIT;
