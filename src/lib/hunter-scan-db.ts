import "server-only";
import {neon} from "@neondatabase/serverless";
import {fetchKprmJobs,SOURCE_KEY,type ScannedJob} from "./hunter-source-kprm";
import type {HunterCategory} from "./talent-hunter";

const TENANT="pamize-internal";
const MAX_NEW_PER_RUN=30;
export type HunterCandidate={id:string;sourceKey:string;sourceUrl:string;externalId:string;title:string;
  company:string;location:string;category:HunterCategory;excerpt:string;status:string;fetchedAt:string};
export type HunterScanRun={id:string;sourceKey:string;status:string;fetchedCount:number;matchedCount:number;
  insertedCount:number;errorCode:string|null;completedAt:string};
function sql(){if(!process.env.DATABASE_URL)throw new Error("db_not_configured");return neon(process.env.DATABASE_URL);}
const asCandidate=(r:Record<string,unknown>):HunterCandidate=>({
  id:String(r.id),sourceKey:String(r.source_key),sourceUrl:String(r.source_url),
  externalId:String(r.external_id),title:String(r.title),company:String(r.company),
  location:String(r.location),category:r.category as HunterCategory,
  excerpt:String(r.job_excerpt??""),status:String(r.status),fetchedAt:String(r.fetched_at)
});
const asRun=(r:Record<string,unknown>):HunterScanRun=>({
  id:String(r.id),sourceKey:String(r.source_key),status:String(r.status),
  fetchedCount:Number(r.fetched_count),matchedCount:Number(r.matched_count),
  insertedCount:Number(r.inserted_count),errorCode:r.error_code===null?null:String(r.error_code),
  completedAt:String(r.completed_at)
});
export async function listHunterCandidates():Promise<{candidates:HunterCandidate[];runs:HunterScanRun[]}>{
  const db=sql();
  const [records,runs]=await Promise.all([
    db`SELECT id,source_key,source_url,external_id,title,company,location,category,job_excerpt,status,fetched_at
      FROM synapse_hunter_candidates WHERE tenant_id=${TENANT}
      ORDER BY fetched_at DESC LIMIT 60`,
    db`SELECT id,source_key,status,fetched_count,matched_count,inserted_count,error_code,completed_at
      FROM synapse_hunter_scan_runs WHERE tenant_id=${TENANT}
      ORDER BY started_at DESC LIMIT 12`
  ]);
  return {candidates:records.map(x=>asCandidate(x)),runs:runs.map(x=>asRun(x))};
}
export async function recordCandidateAnalyzed(sourceUrl:string,analysisId:string):Promise<void>{
  const db=sql();
  await db`UPDATE synapse_hunter_candidates SET status='przeanalizowane',analysis_id=${analysisId}::uuid
     WHERE tenant_id=${TENANT} AND source_url=${sourceUrl} AND status IN ('nowe','do_uzupelnienia')`;
}
async function insertCandidate(record:ScannedJob):Promise<boolean>{
  const db=sql();
  const result=await db`INSERT INTO synapse_hunter_candidates
    (tenant_id,source_key,external_id,source_url,title,company,location,category,job_excerpt,published_at)
    VALUES (${TENANT},${record.sourceKey},${record.externalId},${record.sourceUrl},
      ${record.title},${record.company},${record.location},${record.category},
      ${record.excerpt},${record.publishedAt}::timestamptz)
    ON CONFLICT(tenant_id,source_key,external_id) DO NOTHING RETURNING id`;
  return result.length>0;
}
export async function scanKprm():Promise<{run:HunterScanRun;sample:HunterCandidate[]}>{
  const db=sql();const startedAt=new Date().toISOString();
  let fetched=0,matched=0,inserted=0,status="success",errorCode:string|null=null;
  try{
    const response=await fetchKprmJobs();
    fetched=response.found;matched=response.matched;
    if(matched===0){
      // Only structural field names and aggregate counts; never log job content or personal data.
      console.warn("[Hunter Scanner] KPRM feed shape",response.diagnostics);
    }
    for(const job of response.jobs.slice(0,MAX_NEW_PER_RUN)){
      if(await insertCandidate(job))inserted++;
    }
    // Empty or unrecognized result must be visible; never report a successful scan with zero parsed offers.
    if(matched===0){status="failed";errorCode="no_matching_structured_offers";}
  }catch(e){
    status="failed";
    const raw=e instanceof Error?e.message:"unexpected";
    errorCode=/^[a-z_0-9-]{1,75}$/.test(raw)?raw:"scan_failed";
  }
  const rows=await db`INSERT INTO synapse_hunter_scan_runs
   (tenant_id,source_key,status,fetched_count,matched_count,inserted_count,error_code,started_at,completed_at)
   VALUES (${TENANT},${SOURCE_KEY},${status},${fetched},${matched},${inserted},${errorCode},${startedAt}::timestamptz,now())
   RETURNING id,source_key,status,fetched_count,matched_count,inserted_count,error_code,completed_at`;
  const recent=await db`SELECT id,source_key,source_url,external_id,title,company,location,category,job_excerpt,status,fetched_at
    FROM synapse_hunter_candidates WHERE tenant_id=${TENANT}
    ORDER BY fetched_at DESC LIMIT 10`;
  return {run:asRun(rows[0]),sample:recent.map(x=>asCandidate(x))};
}
