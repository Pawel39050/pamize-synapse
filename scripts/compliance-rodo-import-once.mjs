import {neon} from "@neondatabase/serverless";
import {extractEurLexHtmlArticles} from "../src/lib/compliance/eurlex-html-extractor.ts";
import {createHash} from "node:crypto";
if(process.env.VERCEL_ENV!=="preview"||process.env.VERCEL_GIT_COMMIT_REF!=="feature/compliance-guardian"||
process.env.COMPLIANCE_STORAGE_ENABLED!=="true"||process.env.COMPLIANCE_ISOLATED_DB_CONFIRMED!=="true")
 throw Error("Legal import requires dedicated isolated Preview");
const connection=process.env.COMPLIANCE_DATABASE_URL;
const expected=process.env.COMPLIANCE_EXPECTED_DB_HOST;
if(!connection||!expected||new URL(connection).hostname!==expected||!expected.endsWith(".neon.tech"))
 throw Error("Preview database host mismatch");
const sql=neon(connection);
const identity=await sql`SELECT branch_marker FROM public.compliance_branch_identity WHERE id=1`;
if(identity[0]?.branch_marker!=="pamize-compliance-preview-br-bitter-pond-b97srhrd")throw Error("Wrong Neon branch");
let url="https://publications.europa.eu/resource/celex/32016R0679";
let response;
for(let i=0;i<4;i++){
 response=await fetch(url,{redirect:"manual",signal:AbortSignal.timeout(16000),headers:{Accept:"application/xhtml+xml","Accept-Language":"eng"}});
 if(![301,302,303,307,308].includes(response.status))break;
 const location=response.headers.get("location");
 if(!location)throw Error("Missing CELLAR redirect");
 const next=new URL(location,url);
 if(next.hostname!=="publications.europa.eu"||next.username||next.password)throw Error("Untrusted CELLAR redirect");
 if(next.protocol==="http:")next.protocol="https:";
 if(next.protocol!=="https:")throw Error("Non-HTTPS CELLAR redirect");
 url=next.toString();
}
if(!response?.ok)throw Error("CELLAR did not return a document");
const type=(response.headers.get("content-type")??"").toLowerCase();
if(!type.includes("html")&&!type.includes("xml"))throw Error("Unexpected CELLAR document type");
const buffer=Buffer.from(await response.arrayBuffer());
if(buffer.byteLength>2_000_000)throw Error("Document too large");
const extracted=extractEurLexHtmlArticles(new TextDecoder().decode(buffer));
if(!extracted.ok)throw Error("Official article extraction needs review: "+extracted.reason);
const hash=createHash("sha256").update(buffer).digest("hex");
const rows=await sql`
 INSERT INTO public.compliance_legal_act_versions
 (source_id,celex,official_url,manifestation_id,retrieved_at,document_sha256,articles,authenticity,official_version_label)
 VALUES ('eu-gdpr','32016R0679','https://publications.europa.eu/resource/celex/32016R0679',
 'cellar-celex-32016R0679-eng-unverified',now(),${hash},${JSON.stringify(extracted.articles)}::jsonb,
 'pending-official-verification',NULL)
 ON CONFLICT (celex,manifestation_id,document_sha256) DO NOTHING RETURNING id
`;
const count=await sql`SELECT count(*)::int AS total FROM public.compliance_legal_act_versions WHERE celex='32016R0679'`;
console.log("LEGAL RODO IMPORT: PASS; articles",extracted.articles.length,"new row",rows.length===1,"stored versions",count[0]?.total);
