-- DESIGN ONLY. Do not execute until verified Entra sessions, tenant membership,
-- transactional write API, RLS role grants and audit tests have passed.
BEGIN;
CREATE TABLE IF NOT EXISTS public.compliance_remediation_actions (
 id UUID PRIMARY KEY,
 tenant_id TEXT NOT NULL,
 organization_id TEXT NOT NULL,
 obligation_id TEXT NOT NULL,
 source_url TEXT NOT NULL,
 description TEXT NOT NULL,
 priority TEXT NOT NULL CHECK(priority IN ('high','medium','normal')),
 state TEXT NOT NULL DEFAULT 'proposed'
   CHECK(state IN ('proposed','assigned','in-progress','awaiting-review','approved','rejected')),
 owner_id TEXT,
 due_date DATE,
 reviewer_id TEXT,
 reviewed_at TIMESTAMPTZ,
 revision BIGINT NOT NULL DEFAULT 1 CHECK(revision > 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(tenant_id, organization_id, obligation_id),
 UNIQUE(id, tenant_id, organization_id)
);
CREATE TABLE IF NOT EXISTS public.compliance_remediation_events (
 id UUID PRIMARY KEY,
 action_id UUID NOT NULL,
 tenant_id TEXT NOT NULL,
 organization_id TEXT NOT NULL,
 from_state TEXT,
 to_state TEXT NOT NULL,
 actor_id TEXT NOT NULL,
 occurred_at TIMESTAMPTZ NOT NULL,
 previous_hash CHAR(64),
 event_hash CHAR(64) NOT NULL CHECK(event_hash ~ '^[a-f0-9]{64}$'),
 event_number BIGINT NOT NULL CHECK(event_number > 0),
 CONSTRAINT remediation_action_scope_fk FOREIGN KEY (action_id,tenant_id,organization_id)
 REFERENCES public.compliance_remediation_actions(id,tenant_id,organization_id)
 ON DELETE RESTRICT,
 UNIQUE(action_id,event_number),
 UNIQUE(action_id,event_hash)
);
CREATE INDEX IF NOT EXISTS remediation_scope_status_idx
 ON public.compliance_remediation_actions(tenant_id,organization_id,state,priority,due_date);
CREATE INDEX IF NOT EXISTS remediation_event_scope_idx
 ON public.compliance_remediation_events(tenant_id,organization_id,action_id,event_number);
ALTER TABLE public.compliance_remediation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_remediation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_remediation_actions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_remediation_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.compliance_remediation_actions FROM PUBLIC;
REVOKE ALL ON public.compliance_remediation_events FROM PUBLIC;
-- Deliberately no RLS policies, grants, or exposed API: deny by default.
-- Later deployment requires a trusted tenant-member mapping, restricted DB role,
-- SERIALIZABLE or guarded revision-based transactions, and immutable audit triggers.
COMMIT;
