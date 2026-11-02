import {NextRequest,NextResponse} from "next/server";
import {previewConfig,requirePreviewOrigin,TX_COOKIE,COOKIE_FLAGS,errorResponse} from "@/lib/compliance/entra-route-guard";
import {newOAuthTransaction,buildEntraAuthorizationUrl} from "@/lib/compliance/entra-oauth-flow";
import {sealOAuthTransaction} from "@/lib/compliance/entra-oauth-transaction";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 try{
  requirePreviewOrigin(request);
  const cfg=previewConfig();
  const transaction=newOAuthTransaction();
  const url=buildEntraAuthorizationUrl({...cfg,transaction});
  const response=NextResponse.redirect(url,303);
  response.cookies.set(TX_COOKIE,sealOAuthTransaction(transaction,cfg.oauthKey),{...COOKIE_FLAGS,maxAge:300});
  response.headers.set("cache-control","no-store");
  return response;
 }catch{return errorResponse("Microsoft Preview login is unavailable");}
}
