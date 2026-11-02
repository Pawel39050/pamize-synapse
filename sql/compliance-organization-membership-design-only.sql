-- DESIGN ONLY — do not execute before restricted DB role and membership onboarding review.
-- Applies ONLY to isolated Neon branch br-bitter-pond-b97srhrd.
BEGIN;
CREATE TABLE IF NOT EXISTS public.compliance_organization_memberships (
  tenant_id TEXT NOT NULL CHECK (length(tenant_id) BETWEEN 1 AND 128),
  subject_id TEXT NOT NULL CHECK (length(subject_id) BETWEEN 1 AND 256),
  organization_id TEXT NOT NULL CHECK (length(organization_id) BETWEEN 1 AND 128),
  role TEXT NOT NULL CHECK (role IN ('author','reviewer','viewer')),
  status TEXT NOT NULL DEFAULT 'suspended'
    CHECK (status IN ('active','suspended','revoked')),
  provisioned_by TEXT NOT NULL,
  provisioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revised_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,subject_id,organization_id,role)
);
CREATE INDEX IF NOT EXISTS compliance_membership_lookup_idx
 ON public.compliance_organization_memberships(tenant_id,subject_id,status);
ALTER TABLE public.compliance_organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_organization_memberships FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.compliance_organization_memberships FROM PUBLIC;
-- No RLS policies, privileged runtime role or grants yet: DENY ALL.
-- Members must be provisioned via independently verified admin process.
-- Never create membership from an Entra login, email domain or user-supplied org ID.
COMMIT;
