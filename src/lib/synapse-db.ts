import "server-only";
import {neon} from "@neondatabase/serverless";
import type {HunterDecision,HunterResult} from "./talent-hunter";

const TENANT="pamize-internal";
export function synapseDbConfigured(){return Boolean(process.env.DATABASE_URL?.trim());}
function db(){
  const url=process.env.DATABASE_URL;
  if(!url)throw new Error("Database not configured");
  // Connection stays on the server. Neon HTTP queries use parameter binding.
  return neon(url);
}
export async function listHunterRecords(ownerSubject:string):Promise<HunterResult[]>{
  const sql=db();
  const rows=await sql`
    SELECT result FROM synapse_talent_hunter_records
    WHERE tenant_id=${TENANT} AND owner_subject=${ownerSubject}
    ORDER BY analyzed_at DESC, created_at DESC LIMIT 100`;
  return rows.map(row=>row.result as HunterResult);
}
export async function storeHunterRecord(ownerSubject:string,record:HunterResult,sourceText="",imported=false):Promise<boolean>{
  const sql=db();
  const rows=await sql`
    INSERT INTO synapse_talent_hunter_records (
      id,tenant_id,owner_subject,category,company,title,source_url,source_text,
      potential,score,decision,decision_note,result,imported_from_browser,analyzed_at
    ) VALUES (
      ${record.id},${TENANT},${ownerSubject},${record.category},${record.company},${record.title},
      ${record.sourceUrl},${sourceText.slice(0,16000)},${record.potential},${record.score},
      ${record.decision},${record.decisionNote},${JSON.stringify(record)}::jsonb,${imported},${record.createdAt}::timestamptz
    )
    ON CONFLICT (tenant_id,owner_subject,id) DO NOTHING
    RETURNING id`;
  return rows.length>0;
}
export async function changeHunterDecision(ownerSubject:string,id:string,decision:HunterDecision,note:string):Promise<HunterResult|null>{
  const sql=db();
  const rows=await sql`
    UPDATE synapse_talent_hunter_records
    SET decision=${decision},decision_note=${note},
      result=jsonb_set(
        jsonb_set(result,'{decision}',to_jsonb(${decision}::text),true),
        '{decisionNote}',to_jsonb(${note}::text),true),
      updated_at=NOW()
    WHERE tenant_id=${TENANT} AND owner_subject=${ownerSubject} AND id=${id}::uuid
    RETURNING result`;
  return rows.length?rows[0].result as HunterResult:null;
}
