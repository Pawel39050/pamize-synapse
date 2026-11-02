import type {VerifiedPrincipal,ComplianceRole} from "./assessment-authorization.ts";
export type MembershipRecord={
 tenantId:string;subject:string;organizationId:string;
 status:"active"|"suspended"|"revoked";roles:ComplianceRole[];
};
export type TrustedMembershipDirectory={
 findForSubject(input:{tenantId:string;subject:string}):Promise<readonly MembershipRecord[]>;
};
/** Verified Entra session does not imply membership. Directory results MUST originate
 * from protected server-side storage, never user input or client claims. */
export async function resolveOrganizationMemberships(input:{
 identity:VerifiedPrincipal;directory:TrustedMembershipDirectory;
}):Promise<VerifiedPrincipal>{
 const {identity,directory}=input;
 if(identity.issuer!=="entra-id-verified"||!identity.subject.trim()||
    !identity.tenantId.trim()||identity.roles.length===0)
  throw Error("Verified identity required");
 if(identity.organizationIds.length!==0)
  throw Error("Untrusted pre-populated memberships");
 const records=await directory.findForSubject({
  tenantId:identity.tenantId,subject:identity.subject
 });
 if(records.length>100)throw Error("Membership result limit exceeded");
 const organizations=new Set<string>();
 for(const r of records){
  if(r.tenantId!==identity.tenantId||r.subject!==identity.subject)
   throw Error("Cross-identity membership result");
  if(!r.organizationId.trim()||r.organizationId.length>128)
   throw Error("Invalid organization membership");
  if(!Array.isArray(r.roles)||r.roles.some(role=>
   !["author","reviewer","viewer"].includes(role)))
   throw Error("Invalid membership role");
  if(r.status==="active"&&r.roles.some(role=>identity.roles.includes(role)))
   organizations.add(r.organizationId);
 }
 return {...identity,organizationIds:[...organizations].sort()};
}
/** Safe default until protected membership storage, audit and RLS are verified. */
export const denyAllMembershipDirectory:TrustedMembershipDirectory={
 async findForSubject(){return [];}
};
