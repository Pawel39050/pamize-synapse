import { neon } from "@neondatabase/serverless";
import { createHash } from "node:crypto";

if (process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "feature/compliance-guardian") {
  console.log("Compliance one-time monitor: SKIP (not dedicated Preview)");
} else {
  const connection = process.env.COMPLIANCE_DATABASE_URL;
  const expected = process.env.COMPLIANCE_EXPECTED_DB_HOST;
  if (!connection || !expected) throw new Error("Compliance monitor: missing connection configuration");
  const parsed = new URL(connection);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol) ||
      !parsed.hostname.endsWith(".neon.tech") || parsed.hostname !== expected) {
    throw new Error("Compliance monitor: unapproved Neon host");
  }
  const sql = neon(connection);
  const exists = await sql`SELECT to_regclass('public.compliance_source_snapshots') IS NOT NULL AS ok`;
  if (!exists[0]?.ok) throw new Error("Compliance monitor: snapshot table missing");
  // One allowlisted source; this records website content changes, NOT legal amendments.
  const sourceId = "pl-uodo";
  const sourceUrl = "https://uodo.gov.pl/";
  const response = await fetch(sourceUrl, {
    redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(10000),
    headers: {Accept: "text/html"}
  });
  if (!response.ok || !response.body || response.status >= 300)
    throw new Error("Compliance monitor: official source unavailable, HTTP "+response.status);
  const mime = (response.headers.get("content-type") || "").split(";")[0].toLowerCase();
  if (!["text/html","application/xhtml+xml","text/plain"].includes(mime))
    throw new Error("Compliance monitor: unexpected response content type");
  const reader = response.body.getReader();
  const hash = createHash("sha256");
  let bytes = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024*1024) throw new Error("Compliance monitor: content >1MB limit");
      hash.update(value);
    }
  } finally { reader.releaseLock(); }
  const digest = hash.digest("hex");
  const previous = await sql`SELECT sha256 FROM compliance_source_snapshots
    WHERE source_id = ${sourceId} ORDER BY fetched_at DESC, id DESC LIMIT 1`;
  const status = previous.length === 0 ? "baseline" :
    previous[0].sha256 === digest ? "unchanged" : "website-content-changed";
  if (status !== "unchanged") {
    await sql`INSERT INTO compliance_source_snapshots
      (source_id, fetched_at, sha256, etag, last_modified)
      VALUES (${sourceId}, now(), ${digest}, ${response.headers.get("etag")}, ${response.headers.get("last-modified")})
      ON CONFLICT (source_id, sha256) DO NOTHING`;
  }
  const confirmed = await sql`SELECT id FROM compliance_source_snapshots
    WHERE source_id = ${sourceId} AND sha256 = ${digest} LIMIT 1`;
  if (!confirmed.length) throw new Error("Compliance monitor: database confirmation failed");
  console.log("Compliance one-time monitor: PASS source="+sourceId+" status="+status+
    " bytes="+bytes+" sha256="+digest+" stored="+(status!=="unchanged")+
    " (website fingerprint, NOT a verified legal change)");
}
