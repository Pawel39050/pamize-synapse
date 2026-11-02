-- Applied 2026-11-02 to isolated Neon branch br-bitter-pond-b97srhrd ONLY.
-- Read-only RLS for NOLOGIN role compliance_runtime_restricted_preview.
-- Runtime access and application writes remain disabled.
CREATE POLICY preview_action_read_scope
 ON public.compliance_remediation_actions FOR SELECT
 TO compliance_runtime_restricted_preview
 USING (
  tenant_id=current_setting('app.compliance_tenant_id',true)
  AND organization_id=current_setting('app.compliance_organization_id',true)
  AND NULLIF(current_setting('app.compliance_subject_id',true),'') IS NOT NULL
 );
CREATE POLICY preview_event_read_scope
 ON public.compliance_remediation_events FOR SELECT
 TO compliance_runtime_restricted_preview
 USING (
  tenant_id=current_setting('app.compliance_tenant_id',true)
  AND organization_id=current_setting('app.compliance_organization_id',true)
  AND NULLIF(current_setting('app.compliance_subject_id',true),'') IS NOT NULL
 );
-- SECURITY NOTE: custom PostgreSQL settings can be set by runtime sessions.
-- These policies are defense in depth, NOT proof of membership/identity.
-- Never enable LOGIN, grants or API until signed Entra identity + trusted
-- organization membership are verified and scoped transaction contexts tested.
-- No policy is defined on compliance_organization_memberships (deny all).
-- No INSERT/UPDATE/DELETE policies were created.
