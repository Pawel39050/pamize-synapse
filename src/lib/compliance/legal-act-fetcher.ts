import "server-only";
import { createHash } from "node:crypto";
import { legalSources } from "./regulatory-sources";

/**
 * Stage-II document acquisition, read-only and restricted to the official
 * EU legal-act URLs in the compile-time registry. No legal conclusions,
 * database writes, scheduled execution, or public API.
 */
export type LegalActFetchResult =
  | { ok:true; sourceId:string; canonicalUrl:string; retrievedAt:string;
      contentType:string; byteLength:number; sha256:string;
      text:string; reviewRequired:true }
  | { ok:false; sourceId:string; reason:string };

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["text/html","application/xhtml+xml","text/plain","application/xml","text/xml"]);

export async function fetchOfficialLegalAct(sourceId: string): Promise<LegalActFetchResult> {
  const source = legalSources.find(s => s.id === sourceId);
  if (!source || source.kind !== "binding-law" ||
      !source.officialUrl.startsWith("https://eur-lex.europa.eu/eli/")) {
    return {ok:false, sourceId, reason:"Not an allowlisted official legal act"};
  }
  const target = new URL(source.officialUrl);
  if (target.hostname !== "eur-lex.europa.eu" ||
      target.username || target.password || target.port) {
    return {ok:false, sourceId, reason:"Unapproved legal act host"};
  }
  try {
    const response = await fetch(target.toString(), {
      redirect:"manual", cache:"no-store", signal:AbortSignal.timeout(12000),
      headers:{Accept:"text/html,application/xhtml+xml,text/plain"}
    });
    if (!response.ok || !response.body) {
      return {ok:false, sourceId, reason:`Official source returned HTTP ${response.status}; redirects are not followed`};
    }
    const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!ALLOWED_TYPES.has(contentType)) {
      await response.body.cancel();
      return {ok:false, sourceId, reason:"Unsupported document media type"};
    }
    const announced = Number(response.headers.get("content-length"));
    if (Number.isFinite(announced) && announced > MAX_BYTES) {
      await response.body.cancel();
      return {ok:false, sourceId, reason:"Document exceeds size limit"};
    }
    const reader = response.body.getReader();
    const parts: Uint8Array[] = [];
    let byteLength = 0;
    try {
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        byteLength += value.byteLength;
        if (byteLength > MAX_BYTES) {
          await reader.cancel();
          return {ok:false, sourceId, reason:"Document exceeds size limit"};
        }
        parts.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = Buffer.concat(parts);
    const text = new TextDecoder("utf-8",{fatal:false}).decode(bytes);
    // The raw HTML is not rendered or executed; the caller must separately
    // parse legal provisions and verify the exact authoritative document version.
    return {ok:true, sourceId, canonicalUrl:target.toString(),
      retrievedAt:new Date().toISOString(), contentType, byteLength,
      sha256:createHash("sha256").update(bytes).digest("hex"),
      text, reviewRequired:true};
  } catch {
    return {ok:false, sourceId, reason:"Official document fetch failed or timed out"};
  }
}
