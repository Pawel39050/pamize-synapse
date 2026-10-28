import {NextRequest,NextResponse} from "next/server";
import {analyzeHunter} from "../../../../../lib/talent-hunter-engine";
import {synapseOwner} from "../../../../../lib/synapse-owner";
import {storeHunterRecord,synapseDbConfigured} from "../../../../../lib/synapse-db";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function POST(request:NextRequest){
  const session=synapseOwner(request);
  if(!session)return NextResponse.json({error:"Najpierw połącz konto właściciela Microsoft w Knowledge & Academy."},
    {status:401,headers:{"Cache-Control":"no-store, private"}});
  const origin=request.headers.get("origin");
  if(!origin||origin!==new URL(request.url).origin)return NextResponse.json({error:"Niepoprawne pochodzenie żądania."},{status:403});
  const parsed=request.clone();
  const response=await analyzeHunter(request);
  if(!response.ok)return response;
  const body=await response.json() as {result?:import("../../../../../lib/talent-hunter").HunterResult;aiConfigured:boolean};
  if(!body.result)return NextResponse.json({error:"Brak wyniku analizy."},{status:502});
  if(!synapseDbConfigured())return NextResponse.json({...body,persisted:false,storage:"local"}, {headers:{"Cache-Control":"no-store, private"}});
  try{
    const input=await parsed.json() as {text?:string};
    await storeHunterRecord(session.id,body.result,typeof input.text==="string"?input.text:"");
    return NextResponse.json({...body,persisted:true,storage:"postgres"}, {headers:{"Cache-Control":"no-store, private"}});
  }catch{
    // Return the already paid-for analysis, but explicitly flag that it was not saved.
    console.error("[Talent Hunter] database write failed");
    return NextResponse.json({...body,persisted:false,storage:"local",
      storageWarning:"Analiza zakończona, ale baza danych nie zapisała wyniku. Zachowano lokalnie."},
      {headers:{"Cache-Control":"no-store, private"}});
  }
}
