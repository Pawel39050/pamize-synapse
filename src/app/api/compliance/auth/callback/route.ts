import {NextRequest,NextResponse} from "next/server";
import {previewConfig,requirePreviewOrigin,TX_COOKIE,SESSION_COOKIE,COOKIE_FLAGS,denyBrowserCallback} from "@/lib/compliance/entra-route-guard";
import {openOAuthTransaction} from "@/lib/compliance/entra-oauth-transaction";
import {exchangeEntraAuthorizationCode} from "@/lib/compliance/entra-code-exchange";
import {verifyEntraAccessToken} from "@/lib/compliance/entra-token-verifier";
import {sealComplianceSession} from "@/lib/compliance/entra-session";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 try{
  requirePreviewOrigin(request);
  const cfg=previewConfig();
  if(request.nextUrl.searchParams.has("error"))return denyBrowserCallback();
  const sealed=request.cookies.get(TX_COOKIE)?.value;
  const code=request.nextUrl.searchParams.get("code");
  if(!sealed||!code||code.length>4096)return denyBrowserCallback();
  const transaction=openOAuthTransaction(sealed,cfg.oauthKey);
  const exchanged=await exchangeEntraAuthorizationCode({...cfg,code,
   returnedState:request.nextUrl.searchParams.get("state"),transaction});
  const principal=await verifyEntraAccessToken(exchanged.id_token,{
   tenantId:cfg.tenantId,clientId:cfg.clientId,
   expectedNonce:transaction.nonce,organizationMemberships:{}
  });
  // No tenant organizations are provisioned yet; this cookie never grants customer-record access.
  if(principal.roles.length===0)return denyBrowserCallback();
  const now=Date.now();
  const session=sealComplianceSession({
   subject:principal.subject,tenantId:principal.tenantId,
   roles:[...principal.roles],issuedAt:now,expiresAt:now+60*60*1000
  },cfg.sessionKey);
  const response=NextResponse.redirect("https://pamize-synapse-git-feature-comp-7ded4c-radekdomagalski1978-9203.vercel.app/",303);
  response.cookies.set(TX_COOKIE,"",{...COOKIE_FLAGS,maxAge:0});
  response.cookies.set(SESSION_COOKIE,session,{...COOKIE_FLAGS,maxAge:3600});
  response.headers.set("cache-control","no-store");
  return response;
 }catch{return denyBrowserCallback();}
}
