import {NextRequest,NextResponse} from "next/server";
import {synapseOwner} from "../../../../../lib/synapse-owner";
import {changeHunterDecision,listHunterRecords,storeHunterRecord,synapseDbConfigured} from "../../../../../lib/synapse-db";
import type {HunterDecision,HunterResult} from "../../../../../lib/talent-hunter";

export const runtime="nodejs";
export const dynamic="force-dynamic";
function reply(payload:unknown,status=200){return NextResponse.json(payload,{status,headers:{"Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff"}});}
const allowed=["nowe","zatwierdzone","odrzucone"] as const;
const validId=(x:unknown)=>typeof x==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
function guard(request:NextRequest,write:boolean){
  const session=synapseOwner(request);
  if(!session)return {response:reply({error:"Połącz konto Microsoft właściciela w Knowledge & Academy."},401)};
  if(write&&request.headers.get("origin")!==new URL(request.url).origin)
    return {response:reply({error:"Niepoprawne pochodzenie żądania."},403)};
  return {subject:session.id};
}
function validImport(r:unknown):r is HunterResult {
  if(!r||typeof r!=="object")return false;
  const x=r as Partial<HunterResult>;
  return validId(x.id)&&typeof x.createdAt==="string"&&Number.isFinite(Date.parse(x.createdAt))&&
    x.category!==undefined&&["pzp","zakupy"].includes(x.category)&&
    typeof x.company==="string"&&x.company.length<=140&&typeof x.title==="string"&&x.title.length<=140&&
    typeof x.sourceUrl==="string"&&x.sourceUrl.length<=1000&&
    typeof x.potential==="number"&&x.potential>=0&&x.potential<=100&&
    typeof x.score==="number"&&x.score>=0&&x.score<=100&&
    allowed.includes(x.decision as HunterDecision)&&typeof x.decisionNote==="string"&&x.decisionNote.length<=500&&
    Array.isArray(x.tasks)&&x.tasks.length>=1&&x.tasks.length<=10&&
    x.tasks.every(t=>typeof t.name==="string"&&t.name.length<=140&&typeof t.evidence==="string"&&t.evidence.length<=260&&typeof t.share==="number"&&typeof t.automatable==="number")&&
    typeof x.recommendation==="string"&&x.recommendation.length<=800&&
    typeof x.caveat==="string"&&x.caveat.length<=1000&&
    typeof x.engine==="string"&&["ai","reguły"].includes(x.engine)&&
    typeof x.classification==="string"&&["silny lead","do diagnozy","niski priorytet"].includes(x.classification);
}

export async function GET(request:NextRequest){
  const auth=guard(request,false);
  if(auth.response)return auth.response;
  if(!synapseDbConfigured())return reply({configured:false,records:[],mode:"local"});
  try{
    return reply({configured:true,records:await listHunterRecords(auth.subject!),mode:"postgres"});
  }catch{
    console.error("[Synapse DB] list failed");
    return reply({error:"Połączenie z bazą nie działa lub migracja nie została zastosowana."},503);
  }
}
export async function POST(request:NextRequest){
  const auth=guard(request,true);if(auth.response)return auth.response;
  if(!synapseDbConfigured())return reply({error:"Baza nie została skonfigurowana."},503);
  const len=Number(request.headers.get("content-length")??0);
  if(len>180000)return reply({error:"Zbyt dużo danych do importu."},413);
  let body:unknown;try{body=await request.json();}catch{return reply({error:"Niepoprawny format."},400);}
  const raw=(body as {records?:unknown})?.records;
  if(!Array.isArray(raw)||raw.length<1||raw.length>20||!raw.every(validImport))
    return reply({error:"Nieprawidłowe rekordy; można importować 1–20 analiz na raz."},400);
  try{
    let added=0;
    for(const record of raw){
      if(await storeHunterRecord(auth.subject!,record,"",true))added++;
    }
    return reply({imported:added,skipped:raw.length-added});
  }catch{
    console.error("[Synapse DB] import failed");
    return reply({error:"Nie udało się przenieść wszystkich analiz. Możesz bezpiecznie ponowić import — duplikaty zostaną pominięte."},503);
  }
}
export async function PATCH(request:NextRequest){
  const auth=guard(request,true);if(auth.response)return auth.response;
  if(!synapseDbConfigured())return reply({error:"Baza nie została skonfigurowana."},503);
  let body:unknown;try{body=await request.json();}catch{return reply({error:"Niepoprawny format."},400);}
  const q=body as {id?:unknown;decision?:unknown;decisionNote?:unknown};
  if(!q||!validId(q.id)||!allowed.includes(q.decision as HunterDecision)||
    typeof q.decisionNote!=="string"||q.decisionNote.length>500)
    return reply({error:"Niepoprawne dane decyzji."},400);
  try{
    const updated=await changeHunterDecision(auth.subject!,q.id as string,q.decision as HunterDecision,q.decisionNote);
    return updated?reply({result:updated}):reply({error:"Nie znaleziono analizy."},404);
  }catch{
    console.error("[Synapse DB] update failed");
    return reply({error:"Nie udało się zapisać decyzji w bazie."},503);
  }
}
