import {NextRequest,NextResponse} from "next/server";
import {synapseOwner} from "../../../../../lib/synapse-owner";
import {CONSENT,issueAiApproval} from "../../../../../lib/hunter-ai-approval";
export const runtime="nodejs";
export const dynamic="force-dynamic";
function reply(payload:unknown,status=200){return NextResponse.json(payload,{status,headers:{"Cache-Control":"no-store, private"}});}
export async function POST(request:NextRequest){
  const owner=synapseOwner(request);
  if(!owner)return reply({error:"Zaloguj się na konto Microsoft właściciela."},401);
  if(request.headers.get("origin")!==new URL(request.url).origin)
    return reply({error:"Niepoprawne pochodzenie żądania."},403);
  const length=Number(request.headers.get("content-length")??0);
  if(length>23000)return reply({error:"Zbyt duże żądanie."},413);
  let body:unknown;
  try{body=await request.json();}catch{return reply({error:"Nieprawidłowe dane."},400);}
  const input=body as {confirmation?:unknown;mode?:unknown;job?:unknown;candidateId?:unknown};
  if(!input||input.confirmation!==CONSENT||(input.mode!=="manual"&&input.mode!=="queue"))
    return reply({error:"Brak świadomego zatwierdzenia płatnej analizy."},400);
  try{
    const token=await issueAiApproval(owner.id,input.mode,input.mode==="manual"?input.job:input.candidateId);
    if(!token)return reply({error:"Nie znaleziono właściwej oferty lub dane zmieniły się od czasu podglądu."},409);
    return reply({approvalId:token,expiresInSeconds:300});
  }catch{
    console.error("[Hunter Approval] issue failed");
    return reply({error:"Nie można zapisać zgody. Aktywuj rejestr budżetu i zgód AI."},503);
  }
}
