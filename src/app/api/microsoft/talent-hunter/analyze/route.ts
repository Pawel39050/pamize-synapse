import {NextRequest,NextResponse} from "next/server";
import {analyzeHunter} from "../../../../../lib/talent-hunter-engine";
import {synapseOwner} from "../../../../../lib/synapse-owner";
import {storeHunterRecord,synapseDbConfigured} from "../../../../../lib/synapse-db";
import {recordCandidateAnalyzed} from "../../../../../lib/hunter-scan-db";
import {reserveAiBudget,completeAiBudget} from "../../../../../lib/hunter-ai-budget";
import {consumeAiApproval} from "../../../../../lib/hunter-ai-approval";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function POST(request:NextRequest){
  const session=synapseOwner(request);
  if(!session)return NextResponse.json({error:"Najpierw połącz konto właściciela Microsoft w Knowledge & Academy."},
    {status:401,headers:{"Cache-Control":"no-store, private"}});
  const origin=request.headers.get("origin");
  if(!origin||origin!==new URL(request.url).origin)return NextResponse.json({error:"Niepoprawne pochodzenie żądania."},{status:403});
  const parsed=request.clone();
  let reservationId:string|null=null;
  if(process.env.OPENAI_API_KEY){
    // A paid AI request cannot proceed without a fresh single-use owner approval.
    let approved=false;
    try{
      const body=await request.clone().json() as {approvalId?:string;category?:string;title?:string;company?:string;location?:string;sourceUrl?:string;text?:string};
      approved=await consumeAiApproval(session.id,"manual",body,body.approvalId);
    }catch{approved=false;}
    if(!approved)return NextResponse.json(
      {error:"Wymagana nowa, świadoma zgoda na tę konkretną płatną analizę."},
      {status:403,headers:{"Cache-Control":"no-store, private"}});
    try{
      const reserve=await reserveAiBudget(session.id,"manual");
      if("error" in reserve)return NextResponse.json({error:reserve.error==="budget_exhausted"?
        "Osiągnięto limit analiz AI. Następny dostępny okres rozliczenia rozpocznie się w UTC.":
        "Aktywuj rejestr budżetu AI w zakładce Skaner ofert."},{status:429});
      reservationId=reserve.id;
    }catch{
      return NextResponse.json({error:"Aktywuj kontrolę kosztów AI w zakładce Skaner ofert przed kolejną analizą."},{status:503});
    }
  }
  const response=await analyzeHunter(request);
  const body=await response.json() as {result?:import("../../../../../lib/talent-hunter").HunterResult;aiConfigured:boolean;usage?:{inputTokens:number;outputTokens:number};error?:string};
  if(reservationId){
    try{await completeAiBudget(reservationId,body.usage??null,response.ok&&Boolean(body.result));}
    catch{console.error("[Talent Hunter] usage audit finalization failed");}
  }
  if(!response.ok||!body.result)return NextResponse.json(body,{status:response.status,headers:{"Cache-Control":"no-store, private"}});
  if(!synapseDbConfigured())return NextResponse.json({...body,persisted:false,storage:"local"}, {headers:{"Cache-Control":"no-store, private"}});
  try{
    const input=await parsed.json() as {text?:string};
    await storeHunterRecord(session.id,body.result,typeof input.text==="string"?input.text:"");
    if(body.result.sourceUrl){
      try{await recordCandidateAnalyzed(body.result.sourceUrl,body.result.id);}
      catch{console.warn("[Talent Hunter] candidate status not updated (scanner migration may be pending)");}
    }
    return NextResponse.json({...body,persisted:true,storage:"postgres"}, {headers:{"Cache-Control":"no-store, private"}});
  }catch{
    // Return the already paid-for analysis, but explicitly flag that it was not saved.
    console.error("[Talent Hunter] database write failed");
    return NextResponse.json({...body,persisted:false,storage:"local",
      storageWarning:"Analiza zakończona, ale baza danych nie zapisała wyniku. Zachowano lokalnie."},
      {headers:{"Cache-Control":"no-store, private"}});
  }
}
