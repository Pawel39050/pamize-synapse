import "server-only";
import {createHash,randomUUID} from "node:crypto";
import {neon} from "@neondatabase/serverless";
import type {HunterInput} from "./talent-hunter";

const TENANT="pamize-internal";
export const CONSENT="ZATWIERDZAM_PLATNA_ANALIZE";
type Mode="manual"|"queue";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function db(){if(!process.env.DATABASE_URL)throw Error("database_not_configured");return neon(process.env.DATABASE_URL);}
export function validUuid(value:unknown):value is string{return typeof value==="string"&&UUID.test(value);}
export function manualFingerprint(input:unknown):string|null{
  if(!input||typeof input!=="object")return null;
  const item=input as Record<string,unknown>;
  const keys=["category","title","company","location","sourceUrl","text"];
  if(keys.some(k=>typeof item[k]!=="string"))return null;
  if(!["pzp","zakupy"].includes(item.category as string))return null;
  const data=Object.fromEntries(keys.map(k=>[k,item[k]])) as HunterInput;
  if(data.text.length<160||data.text.length>16000||data.title.length>140||data.company.length>140||data.sourceUrl.length>1000)return null;
  return createHash("sha256").update("manual:"+JSON.stringify(data)).digest("hex");
}
export async function queueFingerprint(candidateId:string):Promise<string|null>{
  if(!validUuid(candidateId))return null;
  const sql=db();
  const rows=await sql`SELECT id,source_url,title,company,job_excerpt,category
    FROM synapse_hunter_candidates
    WHERE tenant_id=${TENANT} AND id=${candidateId}::uuid AND status='nowe'
      AND length(job_excerpt) BETWEEN 160 AND 16000
      AND length(title) BETWEEN 4 AND 140 AND length(company) BETWEEN 4 AND 140
      AND source_url LIKE 'https://nabory.kprm.gov.pl/%'
    LIMIT 1`;
  if(!rows.length)return null;
  const row=rows[0];
  return createHash("sha256")
    .update("queue:"+JSON.stringify([row.id,row.source_url,row.title,row.company,row.job_excerpt,row.category]))
    .digest("hex");
}
export async function initializeAiApprovals():Promise<void>{
  const sql=db();
  await sql`CREATE TABLE IF NOT EXISTS synapse_hunter_ai_approvals (
    id UUID PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    owner_subject TEXT NOT NULL,
    mode TEXT NOT NULL CHECK(mode IN ('manual','queue')),
    fingerprint TEXT NOT NULL CHECK(length(fingerprint)=64),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS ix_hunter_approvals_owner
    ON synapse_hunter_ai_approvals(tenant_id,owner_subject,expires_at DESC)`;
}
export async function approvalsReady():Promise<boolean>{
  const sql=db();
  const rows=await sql`SELECT to_regclass('synapse_hunter_ai_approvals') AS table_name`;
  return Boolean(rows[0]?.table_name);
}
export async function issueAiApproval(
  ownerSubject:string,mode:Mode,task:unknown
):Promise<string|null>{
  let fingerprint:string|null=null;
  if(mode==="manual")fingerprint=manualFingerprint(task);
  if(mode==="queue"&&validUuid(task))fingerprint=await queueFingerprint(task);
  if(!fingerprint)return null;
  const sql=db(),id=randomUUID();
  await sql`INSERT INTO synapse_hunter_ai_approvals
    (id,tenant_id,owner_subject,mode,fingerprint,expires_at)
    VALUES (${id}::uuid,${TENANT},${ownerSubject},${mode},${fingerprint},now()+INTERVAL '5 minutes')`;
  return id;
}
export async function consumeAiApproval(
  ownerSubject:string,mode:Mode,task:unknown,approvalId:unknown
):Promise<boolean>{
  if(!validUuid(approvalId))return false;
  let fingerprint:string|null=null;
  if(mode==="manual")fingerprint=manualFingerprint(task);
  if(mode==="queue"&&validUuid(task))fingerprint=await queueFingerprint(task);
  if(!fingerprint)return false;
  const sql=db();
  const changed=await sql`UPDATE synapse_hunter_ai_approvals
    SET consumed_at=now()
    WHERE id=${approvalId}::uuid AND tenant_id=${TENANT}
      AND owner_subject=${ownerSubject} AND mode=${mode}
      AND fingerprint=${fingerprint}
      AND consumed_at IS NULL AND expires_at>now()
    RETURNING id`;
  return changed.length===1;
}
