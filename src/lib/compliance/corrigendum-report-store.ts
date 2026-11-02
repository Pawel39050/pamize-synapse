import "server-only";
import {neon} from "@neondatabase/serverless";
export type CorrigendumChange={section:string;previous:string;corrected:string;status:string};
export type CorrigendumReport={status:"connected"|"unavailable";correctionCelex:string;language:string;publicationDate:string;officialUrl:string;changes:CorrigendumChange[];coverageCount:number;unreviewedSections:string[];verifiedCount:number;placeholderCount:number;reason?:string};
export async function readGdprCorrigendumReport():Promise<CorrigendumReport>{
 const base={correctionCelex:"32016R0679R(02)",language:"EN",publicationDate:"2018-05-23",officialUrl:"https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679R(02)",changes:[] as CorrigendumChange[],coverageCount:0,unreviewedSections:[] as string[],verifiedCount:0,placeholderCount:0};
 if(process.env.VERCEL_ENV!=="preview"||process.env.VERCEL_GIT_COMMIT_REF!=="feature/compliance-guardian"||process.env.COMPLIANCE_ISOLATED_DB_CONFIRMED!=="true")
  return {...base,status:"unavailable",reason:"Dostęp tylko w izolowanym Preview"};
 const conn=process.env.COMPLIANCE_DATABASE_URL,host=process.env.COMPLIANCE_EXPECTED_DB_HOST;
 if(!conn||!host)return {...base,status:"unavailable",reason:"Brak konfiguracji Neon"};
 try{
  const u=new URL(conn);
  if(!["postgres:","postgresql:"].includes(u.protocol)||u.hostname!==host||!host.endsWith(".neon.tech"))
   return {...base,status:"unavailable",reason:"Niezatwierdzona baza"};
  const sql=neon(conn);
  const marker=await sql`SELECT branch_marker FROM public.compliance_branch_identity WHERE id=1`;
  if(marker[0]?.branch_marker!=="pamize-compliance-preview-br-bitter-pond-b97srhrd")
   return {...base,status:"unavailable",reason:"Nieprawidłowy identyfikator gałęzi"};
  const rows=await sql`SELECT section_ref,previous_text,corrected_text,verification_status FROM public.compliance_corrigendum_changes WHERE corrigendum_celex='32016R0679R(02)' AND language_code='EN' ORDER BY section_ref LIMIT 100`;
  const coverage=await sql`SELECT section_ref FROM public.compliance_corrigendum_coverage WHERE corrigendum_celex='32016R0679R(02)' AND language_code='EN' ORDER BY oj_page,section_ref LIMIT 100`;
  const paired=new Set(rows.map(r=>String(r.section_ref)));
  return {...base,status:"connected",coverageCount:coverage.length,verifiedCount:rows.filter(r=>r.verification_status==="human-verified").length,placeholderCount:rows.filter(r=>/^\s*\[/.test(String(r.corrected_text))).length,unreviewedSections:coverage.map(x=>String(x.section_ref)).filter(x=>!paired.has(x)),changes:rows.map(r=>({section:String(r.section_ref),previous:String(r.previous_text),corrected:String(r.corrected_text),status:String(r.verification_status)}))};
 }catch{return {...base,status:"unavailable",reason:"Nie udało się odczytać raportu"};}
}
