import "server-only";
import { neon } from "@neondatabase/serverless";

export type ComplianceHistoryRow = {
  sourceId: string; fetchedAt: string; sha256: string; etag: string | null; lastModified: string | null;
};
export type ComplianceHistory = {status:"connected" | "unavailable"; rows:ComplianceHistoryRow[]; reason?:string};

export async function readComplianceHistory():Promise<ComplianceHistory> {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "feature/compliance-guardian" ||
      process.env.COMPLIANCE_STORAGE_ENABLED !== "true" ||
      process.env.COMPLIANCE_ISOLATED_DB_CONFIRMED !== "true") {
    return {status:"unavailable",rows:[],reason:"Historia dostępna tylko w dedykowanym Preview"};
  }
  const connection = process.env.COMPLIANCE_DATABASE_URL;
  const expectedHost = process.env.COMPLIANCE_EXPECTED_DB_HOST;
  if (!connection || !expectedHost) return {status:"unavailable",rows:[],reason:"Brak konfiguracji testowej bazy"};
  try {
    const uri = new URL(connection);
    if (!["postgres:","postgresql:"].includes(uri.protocol) ||
        !uri.hostname.endsWith(".neon.tech") || uri.hostname !== expectedHost) {
      return {status:"unavailable",rows:[],reason:"Niezatwierdzony adres bazy"};
    }
    const sql = neon(connection);
    const identity = await sql`SELECT branch_marker FROM public.compliance_branch_identity WHERE id = 1`;
    if (identity[0]?.branch_marker !== "pamize-compliance-preview-br-bitter-pond-b97srhrd") {
      return {status:"unavailable",rows:[],reason:"Nieprawidłowa tożsamość gałęzi testowej Neon"};
    }
    const rows = await sql`
      SELECT source_id, fetched_at, sha256, etag, last_modified
      FROM compliance_source_snapshots
      ORDER BY fetched_at DESC, id DESC LIMIT 50
    `;
    return {status:"connected",rows:rows.map(row=>({
      sourceId:String(row.source_id),fetchedAt:new Date(String(row.fetched_at)).toISOString(),
      sha256:String(row.sha256),etag:row.etag == null ? null : String(row.etag),
      lastModified:row.last_modified == null ? null : String(row.last_modified)
    }))};
  } catch {
    return {status:"unavailable",rows:[],reason:"Odczyt historii nie powiódł się"};
  }
}
