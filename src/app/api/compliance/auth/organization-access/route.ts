import {NextRequest,NextResponse} from "next/server";
import {previewConfig,requirePreviewOrigin,SESSION_COOKIE} from "@/lib/compliance/entra-route-guard";
import {openComplianceSession} from "@/lib/compliance/entra-session";
import {resolveOrganizationMemberships} from "@/lib/compliance/organization-membership";
import {previewMembershipDirectory} from "@/lib/compliance/preview-membership-directory";
import type {ComplianceRole,VerifiedPrincipal} from "@/lib/compliance/assessment-authorization";
export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Read-only Preview diagnostic. Disabled membership storage denies access by default.
 * Even when enabled, this returns no customer records, organization IDs or subject identifiers. */
export async function GET(request:NextRequest){
 const headers={"cache-control":"no-store"};
 try{
  requirePreviewOrigin(request);
  const cfg=previewConfig();
  const cookie=request.cookies.get(SESSION_COOKIE)?.value;
  if(!cookie)return NextResponse.json({authenticated:false,organizationAuthorized:false},{status:401,headers});
  const session=openComplianceSession(cookie,cfg.sessionKey);
  if(session.tenantId!==cfg.tenantId)return NextResponse.json({authenticated:false,organizationAuthorized:false},{status:401,headers});
  const identity:VerifiedPrincipal={issuer:"entra-id-verified",subject:session.subject,
   tenantId:session.tenantId,roles:session.roles as ComplianceRole[],organizationIds:[]};
  const scoped=await resolveOrganizationMemberships({identity,directory:previewMembershipDirectory()});
  const authorized=scoped.organizationIds.length>0;
  return NextResponse.json({authenticated:true,organizationAuthorized:authorized,
   reason:authorized?"verified-membership":"organization-memberships-not-provisioned"},
   {status:authorized?200:403,headers});
 }catch{
  return NextResponse.json({authenticated:false,organizationAuthorized:false},{status:401,headers});
 }
}
