-- Legal Intelligence stage III: isolated Preview Neon only.
-- Apply manually ONLY to compliance-guardian-preview / neondb after review.
CREATE TABLE IF NOT EXISTS public.compliance_legal_act_versions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id TEXT NOT NULL,
  celex TEXT NOT NULL,
  official_url TEXT NOT NULL,
  manifestation_id TEXT NOT NULL,
  retrieved_at TIMESTAMPTZ NOT NULL,
  document_sha256 CHAR(64) NOT NULL,
  articles JSONB NOT NULL,
  authenticity TEXT NOT NULL DEFAULT 'pending-official-verification'
    CHECK (authenticity IN ('pending-official-verification','official-version-verified')),
  official_version_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT compliance_legal_act_versions_unique UNIQUE (celex, manifestation_id, document_sha256),
  CONSTRAINT compliance_legal_act_versions_hash CHECK (document_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT compliance_legal_act_versions_articles CHECK (jsonb_typeof(articles)='array')
);
CREATE INDEX IF NOT EXISTS compliance_legal_versions_latest
  ON public.compliance_legal_act_versions(celex, retrieved_at DESC);
