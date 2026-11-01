-- Proposal only: DO NOT RUN until Preview/Production database isolation is verified.
-- Store only source metadata and content fingerprints, never client data.
CREATE TABLE IF NOT EXISTS compliance_source_snapshots (
  id bigserial PRIMARY KEY,
  source_id text NOT NULL,
  fetched_at timestamptz NOT NULL,
  sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  etag text,
  last_modified text,
  UNIQUE (source_id, sha256)
);
CREATE INDEX IF NOT EXISTS compliance_snapshot_recent
  ON compliance_source_snapshots (source_id, fetched_at DESC, id DESC);
-- Revoke permissions from any public/anonymous DB roles during a reviewed migration.
-- Migration intentionally remains unapplied.
