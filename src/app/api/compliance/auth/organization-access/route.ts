import {NextRequest,NextResponse} from "next/server";
import {previewConfig,requirePreviewOrigin,SESSION_COOKIE} from "@/lib/compliance/entra-route-guard";
import {openComplianceSession} from "@/lib/compliance/entra-session";
import {resolveOrganizationMemberships,denyAllMembershipDirectory} from "@/lib/compliance/organization-membership";
import type {ComplianceRole,VerifiedPrincipal} from "@/lib/compliance/assessment-authorization";
export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Read-only, fail-closed Preview diagnostic. No customer data and no membership provisioning.
 * This endpoint deliberately cannot grant access until a protected, verified server-side
 * membership directory replaces denyAllMembershipDirectory through a separate review. */
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
  const scoped=await resolveOrganizationMemberships({identity,directory:denyAllMembershipDirectory});
  if(scoped.organizationIds.length!==0)throw Error("Unexpected organization access");
  return NextResponse.json({authenticated:true,organizationAuthorized:false,
   reason:"organization-memberships-not-provisioned"},{status:403,headers});
 }catch{
  return NextResponse.json({authenticated:false,organizationAuthorized:false},{status:401,headers});
 }
}
