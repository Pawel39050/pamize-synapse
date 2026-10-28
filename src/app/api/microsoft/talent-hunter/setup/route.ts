import {NextRequest,NextResponse} from "next/server";
import {synapseOwner} from "../../../../../lib/synapse-owner";
import {initializeHunterScanner} from "../../../../../lib/hunter-scan-migrations";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
  if(!synapseOwner(request))return NextResponse.json({error:"Wymagane logowanie Microsoft."},{status:401});
  if(request.headers.get("origin")!==new URL(request.url).origin)
    return NextResponse.json({error:"Niepoprawne pochodzenie żądania."},{status:403});
  try{
    await initializeHunterScanner();
    return NextResponse.json({ok:true,mode:"scanner-ready"},{headers:{"Cache-Control":"no-store, private"}});
  }catch{
    console.error("[Hunter Scanner] schema setup failed");
    return NextResponse.json({error:"Nie udało się utworzyć tabel skanera w Neon."},{status:503});
  }
}
