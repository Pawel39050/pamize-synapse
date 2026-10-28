import "server-only";
import {neon} from "@neondatabase/serverless";

const TENANT="pamize-internal";
const DAY_CENTS=15; // $0.15 / UTC day
const MONTH_CENTS=125; // $1.25 / UTC month
const RESERVATION_CENTS=5; // budget reservation of $0.05 per attempt (not a quoted API price)
const MODEL="gpt-5.4-mini";
export type AiBudget={configured:boolean;todayCount:number;monthCount:number;reservedTodayUsd:number;
  reservedMonthUsd:number;limitDayUsd:number;limitMonthUsd:number;reservationUsd:number;model:string};
function db(){if(!process.env.DATABASE_URL)throw Error("database_not_configured");return neon(process.env.DATABASE_URL);}
const period=()=>{const date=new Date().toISOString().slice(0,10);return {day:date,month:date.slice(0,7)};};
export function approvedAiModel(){return (process.env.TALENT_HUNTER_MODEL??MODEL)===MODEL;}
export async function initializeAiBudget(){
  const sql=db();
  await sql`CREATE TABLE IF NOT EXISTS synapse_hunter_ai_budget (
    tenant_id TEXT PRIMARY KEY,
    day_key TEXT NOT NULL,
    month_key TEXT NOT NULL,
    day_reserved_cents INTEGER NOT NULL DEFAULT 0 CHECK(day_reserved_cents>=0),
    month_reserved_cents INTEGER NOT NULL DEFAULT 0 CHECK(month_reserved_cents>=0),
    day_count INTEGER NOT NULL DEFAULT 0 CHECK(day_count>=0),
    month_count INTEGER NOT NULL DEFAULT 0 CHECK(month_count>=0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS synapse_hunter_ai_usage (
    id UUID PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    owner_subject TEXT NOT NULL,
    origin TEXT NOT NULL CHECK(origin IN ('manual','queue')),
    candidate_id UUID,
    status TEXT NOT NULL CHECK(status IN ('reserved','completed','failed')),
    model TEXT NOT NULL,
    reserved_cents INTEGER NOT NULL CHECK(reserved_cents>=0),
    estimated_cost_usd NUMERIC(12,6),
    input_tokens INTEGER,
    output_tokens INTEGER,
    error_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ
  )`;
  await sql`CREATE INDEX IF NOT EXISTS ix_hunter_usage_tenant_date
    ON synapse_hunter_ai_usage(tenant_id,created_at DESC)`;
}
export async function readAiBudget():Promise<AiBudget>{
  const sql=db(),p=period();
  try{
    const rows=await sql`SELECT day_key,month_key,day_reserved_cents,month_reserved_cents,day_count,month_count
       FROM synapse_hunter_ai_budget WHERE tenant_id=${TENANT}`;
    const row=rows[0];
    return {configured:true,todayCount:row?.day_key===p.day?Number(row.day_count):0,
      monthCount:row?.month_key===p.month?Number(row.month_count):0,
      reservedTodayUsd:(row?.day_key===p.day?Number(row.day_reserved_cents):0)/100,
      reservedMonthUsd:(row?.month_key===p.month?Number(row.month_reserved_cents):0)/100,
      limitDayUsd:DAY_CENTS/100,limitMonthUsd:MONTH_CENTS/100,
      reservationUsd:RESERVATION_CENTS/100,model:MODEL};
  }catch{
    return {configured:false,todayCount:0,monthCount:0,reservedTodayUsd:0,reservedMonthUsd:0,
      limitDayUsd:DAY_CENTS/100,limitMonthUsd:MONTH_CENTS/100,
      reservationUsd:RESERVATION_CENTS/100,model:MODEL};
  }
}
export async function reserveAiBudget(ownerSubject:string,origin:"queue"|"manual",candidateId:string|null=null)
:Promise<{id:string}|{error:string}>{
  if(!process.env.OPENAI_API_KEY)return {error:"api_not_configured"};
  if(!approvedAiModel())return {error:"model_not_supported_by_budget"};
  const sql=db(),p=period();
  // Ensure singleton; a concurrent invocation may initialize it safely.
  await sql`INSERT INTO synapse_hunter_ai_budget(tenant_id,day_key,month_key)
    VALUES(${TENANT},${p.day},${p.month}) ON CONFLICT(tenant_id) DO NOTHING`;
  // This UPDATE is atomic: competing workers cannot exceed either ceiling.
  const allowed=await sql`UPDATE synapse_hunter_ai_budget
    SET day_key=${p.day},month_key=${p.month},
      day_reserved_cents=(CASE WHEN day_key=${p.day} THEN day_reserved_cents ELSE 0 END)+${RESERVATION_CENTS},
      month_reserved_cents=(CASE WHEN month_key=${p.month} THEN month_reserved_cents ELSE 0 END)+${RESERVATION_CENTS},
      day_count=(CASE WHEN day_key=${p.day} THEN day_count ELSE 0 END)+1,
      month_count=(CASE WHEN month_key=${p.month} THEN month_count ELSE 0 END)+1,
      updated_at=now()
    WHERE tenant_id=${TENANT}
      AND (CASE WHEN day_key=${p.day} THEN day_reserved_cents ELSE 0 END)+${RESERVATION_CENTS}<=${DAY_CENTS}
      AND (CASE WHEN month_key=${p.month} THEN month_reserved_cents ELSE 0 END)+${RESERVATION_CENTS}<=${MONTH_CENTS}
    RETURNING tenant_id`;
  if(!allowed.length)return {error:"budget_exhausted"};
  const id=crypto.randomUUID();
  try{
    await sql`INSERT INTO synapse_hunter_ai_usage
    (id,tenant_id,owner_subject,origin,candidate_id,status,model,reserved_cents)
    VALUES(${id}::uuid,${TENANT},${ownerSubject},${origin},${candidateId}::uuid,'reserved',${MODEL},${RESERVATION_CENTS})`;
  }catch{
    // Reservation remains consumed on any audit failure: fail closed, never call the paid API.
    return {error:"usage_audit_failed"};
  }
  return {id};
}
export async function completeAiBudget(id:string,usage:{inputTokens:number;outputTokens:number}|null,success:boolean){
  const sql=db();
  const input=Math.max(0,Math.floor(usage?.inputTokens??0));
  const output=Math.max(0,Math.floor(usage?.outputTokens??0));
  // USD based on standard OpenAI GPT-5.4 mini pricing; cached input ignored (conservative).
  const cost=usage?Math.round((input*0.75/1_000_000+output*4.50/1_000_000)*1_000_000)/1_000_000:null;
  await sql`UPDATE synapse_hunter_ai_usage
    SET status=${success?"completed":"failed"},input_tokens=${usage?input:null}::integer,
      output_tokens=${usage?output:null}::integer,
      estimated_cost_usd=${cost}::numeric,
      error_code=${success?null:"analysis_failed"},finished_at=now()
    WHERE id=${id}::uuid AND tenant_id=${TENANT} AND status='reserved'`;
}
