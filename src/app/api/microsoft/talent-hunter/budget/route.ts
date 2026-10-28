import {NextRequest,NextResponse} from "next/server";
import {synapseOwner} from "../../../../../lib/synapse-owner";
import {initializeAiBudget,readAiBudget} from "../../../../../lib/hunter-ai-budget";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store, private"}});
export async function GET(request:NextRequest){
  if(!synapseOwner(request))return reply({error:"Wymagane logowanie Microsoft."},401);
  try{return reply(await readAiBudget());}
  catch{return reply({error:"Nie udało się odczytać limitów AI."},503);}
}
export async function POST(request:NextRequest){
  if(!synapseOwner(request))return reply({error:"Wymagane logowanie Microsoft."},401);
  if(request.headers.get("origin")!==new URL(request.url).origin)
    return reply({error:"Niepoprawne pochodzenie żądania."},403);
  try{await initializeAiBudget();return reply(await readAiBudget());}
  catch{console.error("[Hunter Budget] initialization failed");
    return reply({error:"Nie udało się przygotować rejestru kosztów w Neon."},503);}
}
