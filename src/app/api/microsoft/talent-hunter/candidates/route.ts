import {NextRequest,NextResponse} from "next/server";
import {synapseOwner} from "../../../../../lib/synapse-owner";
import {listHunterCandidates,scanKprm} from "../../../../../lib/hunter-scan-db";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(x:unknown,status=200)=>NextResponse.json(x,{status,headers:{"Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff"}});
export async function GET(request:NextRequest){
  if(!synapseOwner(request))return reply({error:"Wymagane logowanie konta Microsoft."},401);
  try{return reply(await listHunterCandidates());}
  catch{console.error("[Hunter Scanner] candidate list unavailable");return reply({error:"Skaner wymaga migracji bazy danych 002."},503);}
}
export async function POST(request:NextRequest){
  if(!synapseOwner(request))return reply({error:"Wymagane logowanie konta Microsoft."},401);
  if(request.headers.get("origin")!==new URL(request.url).origin)return reply({error:"Niepoprawne pochodzenie żądania."},403);
  try{
    const result=await scanKprm();
    return reply(result,result.run.status==="success"?200:502);
  }catch{console.error("[Hunter Scanner] scan unavailable");return reply({error:"Skaner wymaga migracji 002 lub połączenia z bazą."},503);}
}
