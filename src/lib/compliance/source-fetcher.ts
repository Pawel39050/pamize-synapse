import "server-only";
import { createHash } from "node:crypto";
import { legalSources } from "./regulatory-sources";

/**
 * First-stage source retrieval. This reads ONLY pre-registered official URLs.
 * A fetched web page is NOT a verified version of a legal act.
 * No public API endpoint, cron, database writes or automatic legal alerts.
 */
export type SourceFetchResult =
  | {ok: true; sourceId: string; url: string; fetchedAt: string; contentType: string; sha256: string; byteLength: number; etag: string | null; lastModified: string | null; validation: "pending-legal-verification"}
  | {ok: false; sourceId: string; reason: string; fetchedAt: string};

const MAX_BYTES = 1024 * 1024;
const TIMEOUT_MS = 10000;

export async function fetchRegisteredLegalSource(sourceId: string): Promise<SourceFetchResult> {
  const fetchedAt = new Date().toISOString();
  const source = legalSources.find((item) => item.id === sourceId);
  if (!source) return {ok: false, sourceId, reason: "Unknown registry source", fetchedAt};

  // Check the exact URL against a compile-time registry; caller never supplies a URL.
  const url = new URL(source.officialUrl);
  if (url.protocol !== "https:" || url.username || url.password) {
    return {ok: false, sourceId, reason: "Invalid registry URL", fetchedAt};
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
      headers: {Accept: "text/html,application/xhtml+xml,application/xml,text/xml,text/plain"}
    });
    if (!response.ok || response.status >= 300 || !response.body) {
      return {ok: false, sourceId, reason: `HTTP ${response.status} (redirects are not followed)`, fetchedAt};
    }
    const contentType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!["text/html", "application/xhtml+xml", "application/xml", "text/xml", "text/plain"].includes(contentType)) {
      await response.body.cancel();
      return {ok: false, sourceId, reason: "Unsupported content type", fetchedAt};
    }
    const contentLength = Number(response.headers.get("content-length"));
    if (contentLength > MAX_BYTES) {
      await response.body.cancel();
      return {ok: false, sourceId, reason: "Response exceeds size limit", fetchedAt};
    }
    const reader = response.body.getReader();
    const hash = createHash("sha256");
    let byteLength = 0;
    try {
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        byteLength += value.byteLength;
        if (byteLength > MAX_BYTES) {
          await reader.cancel();
          return {ok: false, sourceId, reason: "Response exceeds size limit", fetchedAt};
        }
        hash.update(value);
      }
    } finally {
      reader.releaseLock();
    }
    return {
      ok: true, sourceId, url: url.toString(), fetchedAt, contentType,
      sha256: hash.digest("hex"), byteLength,
      etag: response.headers.get("etag"), lastModified: response.headers.get("last-modified"),
      validation: "pending-legal-verification"
    };
  } catch {
    return {ok: false, sourceId, reason: "Fetch failed or timed out", fetchedAt};
  }
}
