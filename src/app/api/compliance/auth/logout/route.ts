import {NextRequest,NextResponse} from "next/server";
import {requirePreviewOrigin,SESSION_COOKIE,TX_COOKIE,COOKIE_FLAGS,errorResponse} from "@/lib/compliance/entra-route-guard";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{
  requirePreviewOrigin(request);
  if(request.headers.get("origin")!=="https://pamize-synapse-git-feature-comp-7ded4c-radekdomagalski1978-9203.vercel.app")
   return errorResponse("Cross-origin logout forbidden",403);
  const response=NextResponse.json({authenticated:false},{headers:{"cache-control":"no-store"}});
  response.cookies.set(SESSION_COOKIE,"",{...COOKIE_FLAGS,maxAge:0});
  response.cookies.set(TX_COOKIE,"",{...COOKIE_FLAGS,maxAge:0});
  return response;
 }catch{return errorResponse("Logout unavailable",403);}
}
