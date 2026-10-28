-- PAMIZE Talent Hunter 1.1: government listings discovery and scan audit
-- 002 is additive and does NOT change or delete the existing Talent Hunter history.
BEGIN;
CREATE TABLE IF NOT EXISTS synapse_hunter_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'pamize-internal',
  source_key TEXT NOT NULL,
  external_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('pzp', 'zakupy')),
  job_excerpt TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'nowe' CHECK (status IN ('nowe','do_uzupelnienia','przeanalizowane','odrzucone')),
  analysis_id UUID,
  UNIQUE (tenant_id, source_key, external_id),
  CHECK (length(source_url) BETWEEN 12 AND 1200),
  CHECK (length(title) BETWEEN 1 AND 220),
  CHECK (length(company) BETWEEN 1 AND 220),
  CHECK (length(job_excerpt) <= 16000)
);
CREATE INDEX IF NOT EXISTS ix_hunter_candidates_recent
 ON synapse_hunter_candidates (tenant_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS ix_hunter_candidates_status
 ON synapse_hunter_candidates (tenant_id, status, category, fetched_at DESC);
CREATE TABLE IF NOT EXISTS synapse_hunter_scan_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'pamize-internal',
  status TEXT NOT NULL CHECK(status IN ('success','failed','skipped')),
  fetched_count INTEGER NOT NULL DEFAULT 0,
  matched_count INTEGER NOT NULL DEFAULT 0,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_hunter_runs_date ON synapse_hunter_scan_runs(tenant_id,started_at DESC);
COMMIT;
