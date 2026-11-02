import type {VerifiedPrincipal,ComplianceRole} from "./assessment-authorization.ts";
import type {TrustedMembershipDirectory} from "./organization-membership.ts";
/** Produces a principal authorized for exactly one organization.
 * A tenant-wide Entra app role NEVER transfers review/author rights between firms.
 * Never accept membership records or this principal from a browser. */
export async function resolveScopedOrganizationPrincipal(input:{
 identity:VerifiedPrincipal;organizationId:string;directory:TrustedMembershipDirectory
}):Promise<VerifiedPrincipal>{
 const {identity,organizationId,directory}=input;
 if(identity.issuer!=="entra-id-verified"||!identity.subject.trim()||
  !identity.tenantId.trim()||!organizationId.trim()||
  identity.organizationIds.length!==0)throw Error("Untrusted identity or scope");
 const records=await directory.findForSubject({tenantId:identity.tenantId,subject:identity.subject});
 if(records.length>100)throw Error("Membership limit exceeded");
 const roles=new Set<ComplianceRole>();
 for(const record of records){
  if(record.tenantId!==identity.tenantId||record.subject!==identity.subject)
   throw Error("Cross-identity membership result");
  if(record.organizationId!==organizationId||record.status!=="active")continue;
  for(const role of record.roles){
   if(!["author","reviewer","viewer"].includes(role))throw Error("Invalid membership role");
   if(identity.roles.includes(role))roles.add(role);
  }
 }
 if(roles.size===0)throw Error("Organization access forbidden");
 return {...identity,organizationIds:[organizationId],roles:[...roles]};
}
