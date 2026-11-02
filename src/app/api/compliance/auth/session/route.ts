import {NextRequest,NextResponse} from "next/server";
import {previewConfig,requirePreviewOrigin,SESSION_COOKIE} from "@/lib/compliance/entra-route-guard";
import {openComplianceSession} from "@/lib/compliance/entra-session";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const headers={"cache-control":"no-store"};
 try{
  requirePreviewOrigin(request);
  const cfg=previewConfig();
  const cookie=request.cookies.get(SESSION_COOKIE)?.value;
  if(!cookie)return NextResponse.json({authenticated:false},{headers});
  const session=openComplianceSession(cookie,cfg.sessionKey);
  if(session.tenantId!==cfg.tenantId)return NextResponse.json({authenticated:false},{headers});
  return NextResponse.json({authenticated:true,roles:session.roles,expiresAt:session.expiresAt},{headers});
 }catch{return NextResponse.json({authenticated:false},{headers});}
}
