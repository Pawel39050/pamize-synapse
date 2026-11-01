import "server-only";
import { neon } from "@neondatabase/serverless";
import type { SourceSnapshot } from "./source-change-assessment";

/**
 * Database persistence is deliberately disabled until the Preview database
 * has been independently verified as isolated from Production.
 * This module is not called by a public route or scheduler.
 */
function writableDatabaseUrl(): string {
  if (process.env.VERCEL_ENV !== "preview") {
    throw new Error("Compliance source writes are restricted to Preview");
  }
  if (process.env.COMPLIANCE_STORAGE_ENABLED !== "true" ||
      process.env.COMPLIANCE_ISOLATED_DB_CONFIRMED !== "true") {
    throw new Error("Compliance database storage is disabled pending isolation review");
  }
  const url = process.env.COMPLIANCE_DATABASE_URL;
  if (!url) throw new Error("COMPLIANCE_DATABASE_URL is not configured");
  return url;
}

/** Reads need the same preview-only isolation gate until deployment review. */
export async function latestSourceSnapshot(sourceId: string): Promise<SourceSnapshot | null> {
  const sql = neon(writableDatabaseUrl());
  const rows = await sql`
    SELECT source_id, fetched_at, sha256, etag, last_modified
    FROM compliance_source_snapshots
    WHERE source_id = ${sourceId}
    ORDER BY fetched_at DESC, id DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    sourceId: String(row.source_id),
    fetchedAt: new Date(String(row.fetched_at)).toISOString(),
    sha256: String(row.sha256),
    etag: row.etag === null ? null : String(row.etag),
    lastModified: row.last_modified === null ? null : String(row.last_modified)
  };
}

export async function saveSourceSnapshot(snapshot: SourceSnapshot): Promise<void> {
  if (!/^[a-f0-9]{64}$/.test(snapshot.sha256)) throw new Error("Invalid source hash");
  const sql = neon(writableDatabaseUrl());
  await sql`
    INSERT INTO compliance_source_snapshots
      (source_id, fetched_at, sha256, etag, last_modified)
    VALUES (${snapshot.sourceId}, ${snapshot.fetchedAt}, ${snapshot.sha256},
            ${snapshot.etag}, ${snapshot.lastModified})
    ON CONFLICT (source_id, sha256) DO NOTHING
  `;
}
