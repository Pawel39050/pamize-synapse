# Neon isolated preview — setup checklist (no production changes)

This document records the **required operator actions**. An isolated database has NOT yet been created.

1. Open the Neon project connected to Vercel `pamize-synapse`.
2. In Neon **Branches**, create a new branch named `compliance-guardian-preview` from the current primary branch. Prefer a schema-only branch, or scrub/anonymize customer data before allowing test access.
3. Create or select a database role with access limited to that branch. Apply reviewed draft migrations ONLY to this Neon branch; never to the primary branch.
4. In Vercel project Environment Variables configure a dedicated `DATABASE_URL` scoped to **Preview** (ideally branch-specific to `feature/compliance-guardian`) pointing to the isolated Neon branch. Keep production `DATABASE_URL` untouched.
5. Confirm branch identity using Neon branch details and a safe read-only SQL query (`select current_database(), current_user;`). These alone do not prove isolation: compare Neon branch IDs in the Neon console.
6. Only after human review, set `COMPLIANCE_ISOLATED_DB_CONFIRMED=true` and `COMPLIANCE_STORAGE_ENABLED=true` for the selected Preview branch, never for Production.
7. Deploy Preview and run one manually controlled integration check. No automatic schedule or public triggering endpoint is configured.
8. Inspect a baseline snapshot, a repeated unchanged fetch, and a controlled changed fixture. Verify all audit entries and database privileges.

**Hard stop:** if the Preview connection points to the production Neon branch, do not run any migration or enable flags.

**Monitoring limitation:** the current source fetcher hashes the response page, not the canonical legal act. A website-content difference is not evidence of a legal amendment. Do not generate legal alerts without review.
