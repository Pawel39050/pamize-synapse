import "server-only";
import type {NextRequest} from "next/server";
import {previewConfig,requirePreviewOrigin,SESSION_COOKIE} from "./entra-route-guard";
import {openComplianceSession} from "./entra-session";
import type {VerifiedPrincipal,ComplianceRole} from "./assessment-authorization";

/** Identity is verified against an encrypted server-issued cookie. Role claims
 * NEVER grant organization membership. Fail closed until a trusted membership
 * directory (not browser input) is integrated. */
export function resolveCompliancePrincipal(request:NextRequest):VerifiedPrincipal{
 requirePreviewOrigin(request);
 const cfg=previewConfig();
 const cookie=request.cookies.get(SESSION_COOKIE)?.value;
 if(!cookie)throw Error("Authentication required");
 const session=openComplianceSession(cookie,cfg.sessionKey);
 if(session.tenantId!==cfg.tenantId)throw Error("Wrong tenant");
 const roles=session.roles.filter((role):role is ComplianceRole=>
  role==="author"||role==="reviewer"||role==="viewer");
 if(!session.subject||roles.length===0)throw Error("No authorized compliance role");
 return {issuer:"entra-id-verified",subject:session.subject,
  tenantId:session.tenantId,roles,organizationIds:[]};
}
