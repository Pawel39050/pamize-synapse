import "server-only";
import {neon} from "@neondatabase/serverless";
import type {TrustedMembershipDirectory,MembershipRecord} from "./organization-membership";

const BRANCH_MARKER="pamize-compliance-preview-br-bitter-pond-b97srhrd";
/** Read-only adapter, disabled until table, scoped DB role, RLS and grants are reviewed.
 * This adapter must never provision memberships or infer them from login alone. */
export function createPreviewMembershipDirectory():TrustedMembershipDirectory{
 return {async findForSubject({tenantId,subject}):Promise<MembershipRecord[]>{
  if(process.env.VERCEL_ENV!=="preview"||
     process.env.VERCEL_GIT_COMMIT_REF!=="feature/compliance-guardian"||
     process.env.COMPLIANCE_ISOLATED_DB_CONFIRMED!=="true"||
     process.env.COMPLIANCE_MEMBERSHIP_READ_ENABLED!=="true")
   throw Error("Membership directory disabled");
  if(!tenantId.trim()||!subject.trim())throw Error("Identity required");
  const connection=process.env.COMPLIANCE_DATABASE_URL;
  const expected=process.env.COMPLIANCE_EXPECTED_DB_HOST;
  if(!connection||!expected||!expected.endsWith(".neon.tech"))
   throw Error("Preview database not configured");
  const uri=new URL(connection);
  if(!["postgres:","postgresql:"].includes(uri.protocol)||
     uri.hostname!==expected||uri.searchParams.get("sslmode")==="disable")
   throw Error("Unexpected database destination");
  const sql=neon(connection);
  const identity=await sql`SELECT branch_marker FROM public.compliance_branch_identity WHERE id=1`;
  if(identity[0]?.branch_marker!==BRANCH_MARKER)
   throw Error("Unexpected database branch");
  const rows=await sql`
    SELECT tenant_id,subject_id,organization_id,role,status
    FROM public.compliance_organization_memberships
    WHERE tenant_id=${tenantId} AND subject_id=${subject}
    ORDER BY organization_id,role LIMIT 101`;
  return rows.map(row=>({
    tenantId:String(row.tenant_id),subject:String(row.subject_id),
    organizationId:String(row.organization_id),
    roles:[String(row.role)] as MembershipRecord["roles"],
    status:String(row.status) as MembershipRecord["status"]
  }));
 }};
}
