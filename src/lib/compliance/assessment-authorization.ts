/** Authorization policy layer; receives identity only from a future verified Entra ID server-side token validator. */
export type ComplianceRole="author"|"reviewer"|"viewer";
export type VerifiedPrincipal={issuer:"entra-id-verified";subject:string;tenantId:string;roles:ComplianceRole[];organizationIds:string[]};
export type ProtectedAction="assessment:create"|"assessment:read"|"assessment:submit"|"assessment:approve"|"assessment:reject";
export function authorizeAssessmentAction(args:{principal:VerifiedPrincipal|null;recordTenantId:string;recordOrganizationId:string;action:ProtectedAction;recordCreatedBy?:string}):boolean{
 const {principal:p,recordTenantId,recordOrganizationId,action,recordCreatedBy}=args;
 if(!p||p.issuer!=="entra-id-verified"||!p.subject.trim()||p.tenantId!==recordTenantId||
   !p.organizationIds.includes(recordOrganizationId))return false;
 const roles=new Set(p.roles);
 if(action==="assessment:read")return roles.has("viewer")||roles.has("author")||roles.has("reviewer");
 if(action==="assessment:create"||action==="assessment:submit")return roles.has("author");
 if(action==="assessment:approve"||action==="assessment:reject")
  return roles.has("reviewer")&&!!recordCreatedBy&&recordCreatedBy!==p.subject;
 return false;
}
