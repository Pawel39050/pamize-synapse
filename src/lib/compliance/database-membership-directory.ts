import type {ComplianceRole} from "./assessment-authorization.ts";
import type {MembershipRecord, TrustedMembershipDirectory} from "./organization-membership.ts";

export type LookupMemberships = (input: {tenantId:string;subject:string}) =>
  Promise<readonly Record<string,unknown>[]>;

/** An adapter for a trusted server-side membership lookup.
 * The caller must supply a restricted and independently authenticated provider.
 * This module has no connection credentials and grants no direct access.
 */
export function createMembershipDirectory(lookup:LookupMemberships):TrustedMembershipDirectory {
  return {
    async findForSubject({tenantId,subject}) {
      if(!tenantId.trim() || !subject.trim()) throw Error("Invalid identity");
      const rows=await lookup({tenantId,subject});
      if(!Array.isArray(rows) || rows.length>100) throw Error("Invalid membership response");
      return rows.map((row):MembershipRecord=>{
        if(row.tenant_id!==tenantId || row.subject_id!==subject)
          throw Error("Cross-identity membership result");
        if(typeof row.organization_id!=="string" ||
          row.organization_id.trim()!==row.organization_id ||
          row.organization_id.length===0 || row.organization_id.length>128)
          throw Error("Invalid organization");
        if(!["viewer","author","reviewer"].includes(String(row.role)))
          throw Error("Invalid organization role");
        if(!["active","revoked","suspended"].includes(String(row.status)))
          throw Error("Invalid membership status");
        return {
          tenantId,subject,organizationId:row.organization_id,
          status:row.status as MembershipRecord["status"],
          roles:[row.role as ComplianceRole]
        };
      });
    }
  };
}
