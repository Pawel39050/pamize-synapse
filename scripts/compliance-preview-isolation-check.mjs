// Read-only preview isolation check. Do not log credentials or hostnames.
import { neon } from "@neondatabase/serverless";
if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "feature/compliance-guardian") {
  const isolated = process.env.COMPLIANCE_DATABASE_URL;
  const ordinary = process.env.DATABASE_URL;
  const approvedHost = process.env.COMPLIANCE_EXPECTED_DB_HOST;
  if (!isolated || !ordinary || !approvedHost) throw new Error("Isolation check: missing connection settings");
  const isolatedUrl = new URL(isolated);
  const ordinaryUrl = new URL(ordinary);
  if (isolatedUrl.hostname !== approvedHost)
    throw new Error("Isolation check: approved host mismatch");
  if (isolatedUrl.hostname === ordinaryUrl.hostname)
    throw new Error("Isolation check: compliance and application share database host");
  const sql = neon(isolated);
  const result = await sql`SELECT to_regclass('public.compliance_source_snapshots') IS NOT NULL AS exists`;
  if (!result[0]?.exists) throw new Error("Isolation check: source snapshots table missing");
  console.log("Compliance isolation check: PASS");
}
