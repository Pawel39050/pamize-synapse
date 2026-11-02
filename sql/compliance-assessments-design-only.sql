-- Stage 4 design-only schema. Not applied to any database.
-- Deployment gate: verified tenant authentication + row-level access + audited approval API.
CREATE TABLE IF NOT EXISTS public.compliance_assessment_revisions (
 id UUID PRIMARY KEY,
 tenant_id TEXT NOT NULL,
 organization_id TEXT NOT NULL,
 revision INT NOT NULL CHECK (revision>0),
 author_id TEXT NOT NULL,
 review_state TEXT NOT NULL CHECK(review_state IN ('draft','submitted','approved','rejected')),
 payload JSONB NOT NULL CHECK(jsonb_typeof(payload)='object'),
 payload_sha256 CHAR(64) NOT NULL CHECK(payload_sha256 ~ '^[a-f0-9]{64}$'),
 previous_revision_hash CHAR(64),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 reviewed_by TEXT,
 reviewed_at TIMESTAMPTZ,
 UNIQUE(tenant_id,organization_id,revision)
);
-- Without a verified authentication and tenant claim implementation:
-- do not grant read/write privileges or expose application API endpoints.
REVOKE ALL ON public.compliance_assessment_revisions FROM PUBLIC;
