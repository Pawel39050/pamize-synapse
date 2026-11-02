import "server-only";
import {NextRequest,NextResponse} from "next/server";
import {checkEntraSetupReadiness} from "./entra-setup-readiness";
export const CALLBACK_HOST="pamize-synapse-git-feature-comp-7ded4c-radekdomagalski1978-9203.vercel.app";
export const TX_COOKIE="__Host-pamize-compliance-txn";
export const SESSION_COOKIE="__Host-pamize-compliance-session";
export const COOKIE_FLAGS={httpOnly:true,secure:true,sameSite:"lax" as const,path:"/"};
export function previewConfig(){
 const result=checkEntraSetupReadiness(process.env);
 if(!result.ready)throw Error("Entra Preview authentication is not configured");
 return {
  tenantId:process.env.ENTRA_TENANT_ID!,
  clientId:process.env.ENTRA_API_CLIENT_ID!,
  redirectUri:process.env.ENTRA_REDIRECT_URI!,
  clientSecret:process.env.ENTRA_CLIENT_SECRET!,
  oauthKey:process.env.ENTRA_OAUTH_COOKIE_KEY!,
  sessionKey:process.env.ENTRA_SESSION_KEY!
 };
}
export function requirePreviewOrigin(request:NextRequest):void{
 if(request.nextUrl.hostname!==CALLBACK_HOST||request.nextUrl.protocol!=="https:")
  throw Error("Unapproved Preview origin");
}
export function errorResponse(message:string,status=503){
 return NextResponse.json({error:message},{status,headers:{"cache-control":"no-store"}});
}
export function denyBrowserCallback(){
 const r=NextResponse.redirect("https://"+CALLBACK_HOST+"/",303);
 r.cookies.set(TX_COOKIE,"",{...COOKIE_FLAGS,maxAge:0});
 r.headers.set("cache-control","no-store");
 return r;
}
