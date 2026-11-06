import {NextRequest,NextResponse} from "next/server";
import {neon} from "@neondatabase/serverless";
import {analyzeHunter} from "../../../../../lib/talent-hunter-engine";
import {synapseOwner} from "../../../../../lib/synapse-owner";
import {reserveAiBudget,completeAiBudget} from "../../../../../lib/hunter-ai-budget";
import {storeHunterRecord} from "../../../../../lib/synapse-db";
import {consumeAiApproval,validUuid} from "../../../../../lib/hunter-ai-approval";
import type {HunterResult,HunterInput} from "../../../../../lib/talent-hunter";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const TENANT="pamize-internal";
function reply(data:unknown,status=200){return NextResponse.json(data,{status,headers:{"Cache-Control":"no-store, private"}});}
type Candidate={id:string;source_url:string;title:string;company:string;location:string;job_excerpt:string;category:"pzp"|"zakupy"};
export async function GET(request:NextRequest){
  if(!synapseOwner(request))return reply({error:"Zaloguj się na konto Microsoft właściciela."},401);
  if(!process.env.DATABASE_URL)return reply({error:"Brak bazy PostgreSQL."},503);
  try{
    const sql=neon(process.env.DATABASE_URL);
    const rows=await sql`SELECT id,title,company,source_url,category,length(job_excerpt) AS text_length
      FROM synapse_hunter_candidates
      WHERE tenant_id=${TENANT} AND status='nowe'
        AND length(job_excerpt) BETWEEN 160 AND 16000
        AND length(title) BETWEEN 4 AND 140 AND length(company) BETWEEN 4 AND 140
        AND source_url LIKE 'https://nabory.kprm.gov.pl/%'
      ORDER BY fetched_at DESC,id LIMIT 1`;
    const candidate=rows[0];
    return reply({candidate:candidate?{
      id:String(candidate.id),title:String(candidate.title),company:String(candidate.company),
      sourceUrl:String(candidate.source_url),category:String(candidate.category),textLength:Number(candidate.text_length)
    }:null});
  }catch{return reply({error:"Podgląd kolejki jest niedostępny."},503);}
}
export async function POST(request:NextRequest){
  const owner=synapseOwner(request);
  if(!owner)return reply({error:"Połącz konto Microsoft właściciela."},401);
  if(request.headers.get("origin")!==new URL(request.url).origin)return reply({error:"Niepoprawne pochodzenie żądania."},403);
  if(!process.env.OPENAI_API_KEY)return reply({error:"Brak klucza OpenAI."},503);
  if(!process.env.DATABASE_URL)return reply({error:"Brak bazy PostgreSQL."},503);
  let requested:unknown,approvalId:unknown;
  try{
    const body=await request.json() as {candidateId?:unknown;approvalId?:unknown};
    requested=body.candidateId;approvalId=body.approvalId;
  }catch{return reply({error:"Niepoprawne żądanie zatwierdzenia."},400);}
  if(!validUuid(requested))return reply({error:"Wskaż konkretną ofertę do zatwierdzenia."},400);
  let approved=false;
  try{approved=await consumeAiApproval(owner.id,"queue",requested,approvalId);}catch{approved=false;}
  if(!approved)return reply({error:"Brak ważnej, jednorazowej zgody właściciela na tę ofertę."},403);
  const sql=neon(process.env.DATABASE_URL);
  let candidate:Candidate|null=null;
  let reservationId:string|null=null;
  let usedApi=false;
  try{
    // Atomic claim: two concurrent clicks cannot analyze the same vacancy twice.
    const rows=await sql`
      WITH picked AS (
        SELECT id FROM synapse_hunter_candidates
        WHERE tenant_id=${TENANT} AND id=${requested}::uuid AND status='nowe'
          AND length(job_excerpt) BETWEEN 160 AND 16000
          AND length(title) BETWEEN 4 AND 140 AND length(company) BETWEEN 4 AND 140
          AND source_url LIKE 'https://nabory.kprm.gov.pl/%'
        LIMIT 1 FOR UPDATE SKIP LOCKED
      )
      UPDATE synapse_hunter_candidates c
      SET status='do_uzupelnienia'
      FROM picked p
      WHERE c.id=p.id
      RETURNING c.id,c.source_url,c.title,c.company,c.location,c.job_excerpt,c.category`;
    if(!rows.length)return reply({error:"Oferta nie jest już dostępna do analizy. Odśwież podgląd i zatwierdź ponownie."},409);
    const row=rows[0];
    candidate={id:String(row.id),source_url:String(row.source_url),title:String(row.title),
      company:String(row.company),location:String(row.location),job_excerpt:String(row.job_excerpt),
      category:row.category as "pzp"|"zakupy"};
    const reserve=await reserveAiBudget(owner.id,"queue",candidate.id);
    if("error" in reserve){
      await sql`UPDATE synapse_hunter_candidates SET status='nowe'
        WHERE tenant_id=${TENANT} AND id=${candidate.id}::uuid AND status='do_uzupelnienia'`;
      return reply({error:reserve.error==="budget_exhausted"?
        "Dzienne lub miesięczne limity analiz AI zostały wyczerpane. Nie naliczono kosztu za nową analizę.":
        reserve.error==="model_not_supported_by_budget"?"Wybrany model nie jest objęty kontrolą budżetu.":
        "Aktywuj kontrolę budżetu AI w zakładce Skaner ofert."},429);
    }
    reservationId=reserve.id;
    const input:HunterInput={title:candidate.title,company:candidate.company,location:candidate.location,
      sourceUrl:candidate.source_url,category:candidate.category,text:candidate.job_excerpt};
    const internal=new NextRequest(request.nextUrl.origin+"/api/microsoft/talent-hunter/analyze",{
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)
    });
    usedApi=true;
    const response=await analyzeHunter(internal);
    const result=await response.json() as {result?:HunterResult;error?:string;usage?:{inputTokens:number;outputTokens:number}};
    if(!response.ok||!result.result){
      await completeAiBudget(reservationId,result.usage??null,false);
      return reply({error:"Nie udało się zweryfikować analizy tego ogłoszenia. Oznaczono je do ręcznego sprawdzenia.",
        detail:result.error??"Błąd analizy AI"},422);
    }
    // Store first; only then mark source as analyzed.
    await storeHunterRecord(owner.id,result.result,input.text);
    await sql`UPDATE synapse_hunter_candidates SET status='przeanalizowane',
       analysis_id=${result.result.id}::uuid WHERE tenant_id=${TENANT} AND id=${candidate.id}::uuid`;
    await completeAiBudget(reservationId,result.usage??null,true);
    return reply({ok:true,result:result.result,
      usage:result.usage??null,source:"KPRM",persisted:true});
  }catch{
    console.error("[Hunter AI Queue] controlled analysis failed");
    if(reservationId&&usedApi){
      try{await completeAiBudget(reservationId,null,false);}
      catch{console.error("[Hunter AI Queue] failed to finalize usage");}
    }
    // Claimed candidates intentionally remain in 'do_uzupelnienia' after failures
    // to avoid repeat paid calls and let an owner inspect the source.
    return reply({error:"Nie udało się zapisać analizy kolejki. Ogłoszenie pozostaje do ręcznej weryfikacji."},503);
  }
}
