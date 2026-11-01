import "server-only";
import {neon} from "@neondatabase/serverless";
import type {LegalActVersion} from "./legal-act-version";

const EXPECTED_MARKER = "pamize-compliance-preview-br-bitter-pond-b97srhrd";
function connection():string {
  if(process.env.VERCEL_ENV!=="preview" ||
     process.env.VERCEL_GIT_COMMIT_REF!=="feature/compliance-guardian" ||
     process.env.COMPLIANCE_STORAGE_ENABLED!=="true" ||
     process.env.COMPLIANCE_ISOLATED_DB_CONFIRMED!=="true")
    throw new Error("Legal act version storage is restricted to isolated Preview");
  const url=process.env.COMPLIANCE_DATABASE_URL;
  const approved=process.env.COMPLIANCE_EXPECTED_DB_HOST;
  if(!url||!approved) throw new Error("Compliance database not configured");
  const parsed=new URL(url);
  if(!["postgres:","postgresql:"].includes(parsed.protocol)||
     !parsed.hostname.endsWith(".neon.tech")||parsed.hostname!==approved)
    throw new Error("Unapproved Compliance Neon host");
  return url;
}
async function checkedDatabase(){
  const sql=neon(connection());
  const rows=await sql`SELECT branch_marker FROM public.compliance_branch_identity WHERE id=1`;
  if(rows[0]?.branch_marker!==EXPECTED_MARKER)
    throw new Error("Legal version storage branch identity mismatch");
  return sql;
}

/** Persist only typed evidence. No public write route calls this function. */
export async function saveLegalActVersion(v:LegalActVersion):Promise<boolean>{
  if(!/^3\d{4}[RL]\d{4}$/.test(v.celex) ||
     !/^[a-f0-9]{64}$/.test(v.documentSha256) ||
     !v.articles.length || v.articles.length>2000 ||
     !v.manifestationId.trim())
    throw new Error("Invalid legal version evidence");
  const url=new URL(v.officialUrl);
  if(url.protocol!=="https:"||
     !["publications.europa.eu","eur-lex.europa.eu"].includes(url.hostname))
    throw new Error("Untrusted legal document source");
  const sql=await checkedDatabase();
  const rows=await sql`
    INSERT INTO public.compliance_legal_act_versions
      (source_id,celex,official_url,manifestation_id,retrieved_at,
       document_sha256,articles,authenticity,official_version_label)
    VALUES (${v.sourceId},${v.celex},${v.officialUrl},${v.manifestationId},
      ${v.retrievedAt},${v.documentSha256},${JSON.stringify(v.articles)}::jsonb,
      ${v.authenticity},${v.officialVersionLabel})
    ON CONFLICT (celex,manifestation_id,document_sha256) DO NOTHING
    RETURNING id
  `;
  return rows.length===1;
}

/** Read verified/pending evidence from the same isolated Preview branch. */
export async function listLegalActVersions(celex:string):Promise<LegalActVersion[]>{
  if(!/^3\d{4}[RL]\d{4}$/.test(celex))throw new Error("Invalid CELEX");
  const sql=await checkedDatabase();
  const rows=await sql`
    SELECT source_id,celex,official_url,manifestation_id,retrieved_at,
           document_sha256,articles,authenticity,official_version_label
    FROM public.compliance_legal_act_versions
    WHERE celex=${celex}
    ORDER BY retrieved_at DESC,id DESC LIMIT 20
  `;
  return rows.map(r=>({
    sourceId:String(r.source_id),celex:String(r.celex),
    officialUrl:String(r.official_url),manifestationId:String(r.manifestation_id),
    retrievedAt:new Date(String(r.retrieved_at)).toISOString(),
    documentSha256:String(r.document_sha256),
    articles:r.articles as LegalActVersion["articles"],
    authenticity:r.authenticity as LegalActVersion["authenticity"],
    officialVersionLabel:r.official_version_label==null?null:String(r.official_version_label)
  }));
}
