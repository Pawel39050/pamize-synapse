// Read-only preview isolation check. Do not log credentials or hostnames.
import { neon } from "@neondatabase/serverless";
if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "feature/compliance-guardian") {
  const isolated = process.env.COMPLIANCE_DATABASE_URL;
  const approvedHost = process.env.COMPLIANCE_EXPECTED_DB_HOST;
  const forbiddenHost = process.env.COMPLIANCE_FORBIDDEN_DB_HOST;
  if (!isolated || !approvedHost || !forbiddenHost) throw new Error("Isolation check: missing connection settings");
  const isolatedUrl = new URL(isolated);
  if (!isolatedUrl.hostname.endsWith(".neon.tech") ||
      !approvedHost.endsWith(".neon.tech") ||
      !forbiddenHost.endsWith(".neon.tech") ||
      isolatedUrl.hostname !== approvedHost)
    throw new Error("Isolation check: approved host mismatch");
  if (isolatedUrl.hostname === forbiddenHost || approvedHost === forbiddenHost)
    throw new Error("Isolation check: compliance and application share database host");
  const sql = neon(isolated);
  const result = await sql`SELECT to_regclass('public.compliance_source_snapshots') IS NOT NULL AS exists`;
  if (!result[0]?.exists) throw new Error("Isolation check: source snapshots table missing");
  const identity = await sql`SELECT branch_marker FROM public.compliance_branch_identity WHERE id = 1`;
  if (identity[0]?.branch_marker !== "pamize-compliance-preview-br-bitter-pond-b97srhrd")
    throw new Error("Isolation check: wrong Neon branch identity");
  console.log("Compliance isolation check: PASS");
}
