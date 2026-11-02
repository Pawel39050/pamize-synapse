-- DESIGN REFERENCE ONLY; do NOT execute this template.
-- Inputs must come from verified server-side principal and validated command.
-- Runtime must open an actual SQL transaction on a restricted RLS connection.
BEGIN;
-- Set tenant context ONLY using an authenticated, server-provisioned organization scope.
-- Never accept these identifiers directly from untrusted request JSON.
SELECT id, state, revision, owner_id
FROM public.compliance_remediation_actions
WHERE id = :action_id
  AND tenant_id = :tenant_id AND organization_id = :organization_id
FOR UPDATE;
-- The application must validate permitted transition, revision, ownership,
-- independent reviewer and continuity of event hashes before mutating.
UPDATE public.compliance_remediation_actions
SET state = :next_state, revision = revision + 1,
    updated_at = now()
WHERE id = :action_id AND tenant_id = :tenant_id
  AND organization_id = :organization_id
  AND revision = :expected_revision
  AND state = :expected_state;
-- Require exactly one updated row; otherwise ROLLBACK.
-- Insert audit event only after locking its per-action sequence.
INSERT INTO public.compliance_remediation_events
 (id, action_id, tenant_id, organization_id, from_state, to_state,
  actor_id, occurred_at, previous_hash, event_hash, event_number)
VALUES
 (:event_id, :action_id, :tenant_id, :organization_id, :expected_state,
  :next_state, :actor_id, :occurred_at, :previous_hash, :event_hash,
  :event_number);
COMMIT;
-- Parameter placeholders are illustrative, not directly executable PostgreSQL SQL.
-- No migration or API exposure authorized by this document.
