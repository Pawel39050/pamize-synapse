-- PAMIZE Synapse: Foundation DB v0.3 (owner MVP), 2026-10-28
-- Apply once in the Neon SQL Editor, after database provisioning.
-- Separate tenants/accounts in every query; full customer RLS is future work.
-- Avoid storing customer-confidential data in this owner-only MVP.
BEGIN;
CREATE TABLE IF NOT EXISTS synapse_talent_hunter_records (
  id UUID NOT NULL,
  tenant_id TEXT NOT NULL,
  owner_subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('pzp','zakupy')),
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL DEFAULT '',
  source_text TEXT NOT NULL DEFAULT '',
  potential SMALLINT NOT NULL CHECK (potential BETWEEN 0 AND 100),
  score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  decision TEXT NOT NULL CHECK (decision IN ('nowe','zatwierdzone','odrzucone')),
  decision_note TEXT NOT NULL DEFAULT '',
  result JSONB NOT NULL,
  imported_from_browser BOOLEAN NOT NULL DEFAULT FALSE,
  analyzed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, owner_subject, id),
  CHECK (length(tenant_id) BETWEEN 1 AND 100),
  CHECK (length(owner_subject) BETWEEN 1 AND 180),
  CHECK (length(source_text) <= 16000),
  CHECK (jsonb_typeof(result)='object')
);
CREATE INDEX IF NOT EXISTS ix_th_owner_recent
  ON synapse_talent_hunter_records(tenant_id, owner_subject, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS ix_th_owner_decisions
  ON synapse_talent_hunter_records(tenant_id, owner_subject, decision, score DESC);
-- Reserved for agent execution telemetry; no runtime worker enabled yet.
CREATE TABLE IF NOT EXISTS synapse_agent_runs (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  owner_subject TEXT NOT NULL,
  agent_key TEXT NOT NULL,
  agent_version TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('queued','running','completed','failed','canceled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  input_ref TEXT,
  output_ref TEXT,
  model_name TEXT,
  input_tokens INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
  cost_usd NUMERIC(12,6) CHECK (cost_usd IS NULL OR cost_usd >= 0),
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_runs_tenant_agent_date
  ON synapse_agent_runs(tenant_id, owner_subject, agent_key, started_at DESC);
COMMIT;
