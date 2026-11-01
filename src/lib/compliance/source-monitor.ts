import "server-only";
import { fetchRegisteredLegalSource } from "./source-fetcher";
import { latestSourceSnapshot, saveSourceSnapshot } from "./source-snapshot-store";
import { assessSourceSnapshot, type SourceSnapshot } from "./source-change-assessment";

/**
 * Internal orchestrator. Not exposed via HTTP and not scheduled.
 * A change in a webpage is NOT a regulatory/legal change.
 * Persistent execution remains gated inside source-snapshot-store.ts.
 */
export type MonitorOutcome =
  | { status: "fetch-error"; sourceId: string; reason: string; persisted: false }
  | { status: "storage-error"; sourceId: string; reason: string; persisted: false }
  | {
      status: "baseline" | "unchanged" | "website-content-changed";
      sourceId: string;
      fetchedAt: string;
      sha256: string;
      requiresDocumentReview: boolean;
      persisted: boolean;
    };

export async function monitorRegisteredSource(sourceId: string): Promise<MonitorOutcome> {
  // Fail before any network request when write safety has not been confirmed.
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.COMPLIANCE_STORAGE_ENABLED !== "true" ||
      process.env.COMPLIANCE_ISOLATED_DB_CONFIRMED !== "true") {
    return { status: "storage-error", sourceId, reason: "Storage gate disabled or not Preview", persisted: false };
  }

  const fetched = await fetchRegisteredLegalSource(sourceId);
  if (!fetched.ok) {
    return { status: "fetch-error", sourceId, reason: fetched.reason, persisted: false };
  }
  const current: SourceSnapshot = {
    sourceId: fetched.sourceId,
    fetchedAt: fetched.fetchedAt,
    sha256: fetched.sha256,
    etag: fetched.etag,
    lastModified: fetched.lastModified
  };
  try {
    const previous = await latestSourceSnapshot(sourceId);
    const decision = assessSourceSnapshot(previous, current);
    // Store the baseline and changed fingerprints; unchanged fetches are not duplicated.
    if (decision.status !== "unchanged") await saveSourceSnapshot(current);
    return {
      status: decision.status,
      sourceId,
      fetchedAt: current.fetchedAt,
      sha256: current.sha256,
      requiresDocumentReview: decision.requiresDocumentReview,
      persisted: decision.status !== "unchanged"
    };
  } catch {
    // Never claim success when persistence fails, and never overwrite last good data.
    return { status: "storage-error", sourceId, reason: "Snapshot read/write failed", persisted: false };
  }
}
