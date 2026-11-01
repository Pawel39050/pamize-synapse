import { neon } from "@neondatabase/serverless";

if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== "feature/compliance-guardian") {
  console.log("Compliance connection check: SKIP (not the dedicated preview)");
} else {
  const connection = process.env.COMPLIANCE_DATABASE_URL;
  const expected = process.env.COMPLIANCE_EXPECTED_DB_HOST;
  if (!connection || !expected) throw new Error("Compliance connection check: FAIL (configuration missing)");
  const uri = new URL(connection);
  if (!["postgres:", "postgresql:"].includes(uri.protocol) ||
      !uri.hostname.endsWith(".neon.tech") || uri.hostname !== expected) {
    throw new Error("Compliance connection check: FAIL (unexpected database host)");
  }
  const sql = neon(connection);
  const result = await sql`SELECT current_database() AS database_name, to_regclass('public.compliance_source_snapshots') IS NOT NULL AS table_exists`;
  if (!result[0]?.table_exists) throw new Error("Compliance connection check: FAIL (snapshot table absent)");
  const identity = await sql`SELECT branch_marker FROM public.compliance_branch_identity WHERE id = 1`;
  if (identity[0]?.branch_marker !== "pamize-compliance-preview-br-bitter-pond-b97srhrd") {
    throw new Error("Compliance connection check: FAIL (wrong Neon branch identity)");
  }
  console.log("Compliance connection check: PASS (Preview DB marker verified; no writes)");

}
