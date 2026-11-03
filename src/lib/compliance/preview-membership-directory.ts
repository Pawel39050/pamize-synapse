import "server-only";
import {neon} from "@neondatabase/serverless";
import {createMembershipDirectory} from "./database-membership-directory";
import {denyAllMembershipDirectory,type TrustedMembershipDirectory} from "./organization-membership";

const EXPECTED_BRANCH_MARKER="pamize-compliance-preview-br-bitter-pond-b97srhrd";
const LOGIN_ROLE="compliance_membership_login_restricted";

/** Safe default: not enabled without a dedicated least-privilege Neon login.
 * Never reuse COMPLIANCE_DATABASE_URL or the database owner for identity lookups. */
export function previewMembershipDirectory():TrustedMembershipDirectory{
 if(process.env.COMPLIANCE_MEMBERSHIP_READ_ENABLED!=="true")
  return denyAllMembershipDirectory;
 if(process.env.VERCEL_ENV!=="preview"||
    process.env.VERCEL_GIT_COMMIT_REF!=="feature/compliance-guardian")
  throw Error("Membership directory restricted to isolated Preview");
 const url=process.env.COMPLIANCE_MEMBERSHIP_DATABASE_URL;
 const expected=process.env.COMPLIANCE_EXPECTED_DB_HOST;
 const forbidden=process.env.COMPLIANCE_FORBIDDEN_DB_HOST;
 if(!url||!expected||!forbidden)throw Error("Membership database configuration missing");
 const parsed=new URL(url);
 if(!["postgres:","postgresql:"].includes(parsed.protocol)||
    parsed.hostname!==expected||parsed.hostname===forbidden||
    expected===forbidden||!expected.endsWith(".neon.tech")||
    decodeURIComponent(parsed.username)!==LOGIN_ROLE)
  throw Error("Unsafe membership database connection");
 const sql=neon(url);
 return createMembershipDirectory(async({tenantId,subject})=>{
  // Each query in a read-only HTTP transaction shares the transaction-local RLS context.
  const [identity,scope,rows]=await sql.transaction([
   sql`SELECT current_user AS role_name,
     (SELECT rolbypassrls OR rolsuper OR rolcreatedb OR rolcreaterole
        FROM pg_roles WHERE rolname=current_user) AS elevated,
     (SELECT branch_marker FROM public.compliance_branch_identity WHERE id=1) AS branch_marker`,
   sql`SELECT set_config('app.compliance_tenant_id',${tenantId},true),
      set_config('app.compliance_subject_id',${subject},true)`,
   sql`SELECT tenant_id,subject_id,organization_id,role,status
     FROM public.compliance_organization_memberships
     WHERE tenant_id=${tenantId} AND subject_id=${subject} LIMIT 101`
  ],{readOnly:true});
  const role=identity[0];
  if(role?.role_name!==LOGIN_ROLE||role.elevated!==false||
     role.branch_marker!==EXPECTED_BRANCH_MARKER)
   throw Error("Membership runtime identity verification failed");
  if(scope.length!==1)throw Error("Membership scope not established");
  return rows;
 });
}
