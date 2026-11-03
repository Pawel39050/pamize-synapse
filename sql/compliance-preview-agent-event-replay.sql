-- Preview-only migration proposal for the protected agent event channel.
-- Do not apply to production, and do not grant privileges to public/API roles.
-- Requires an independent restricted ingestion role provisioned by an administrator.
CREATE TABLE IF NOT EXISTS public.compliance_agent_event_replay_nonces (
 tenant_id text NOT NULL CHECK (tenant_id ~ '^[A-Za-z0-9_-]{3,100}$'),
 organization_id text NOT NULL CHECK (organization_id ~ '^[A-Za-z0-9_-]{3,100}$'),
 agent_key text NOT NULL CHECK (agent_key = 'AG-PRC-001'),
 nonce text NOT NULL CHECK (nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
 received_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 CONSTRAINT compliance_agent_event_replay_unique PRIMARY KEY (tenant_id,organization_id,agent_key,nonce),
 CONSTRAINT compliance_agent_event_expiry_order CHECK (expires_at > received_at)
);
ALTER TABLE public.compliance_agent_event_replay_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_agent_event_replay_nonces FORCE ROW LEVEL SECURITY;
-- Without an explicitly installed row-level policy and restricted service role,
-- this table fails closed for non-bypass RLS roles. Do not grant service access yet.
COMMENT ON TABLE public.compliance_agent_event_replay_nonces IS
 'Preview only: nonce uniqueness guard for signed agent batches; no customer content.';
