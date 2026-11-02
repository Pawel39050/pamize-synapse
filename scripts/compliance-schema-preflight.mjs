import {neon} from "@neondatabase/serverless";
const BRANCH="pamize-compliance-preview-br-bitter-pond-b97srhrd";
export function assessSchemaReadiness(snapshot){
 if(snapshot.marker!==BRANCH)throw Error("Wrong Neon branch");
 const missing=["actions","events","memberships"].filter(key=>!snapshot[key]);
 const privileged=snapshot.db_role==="neondb_owner"||snapshot.superuser===true||snapshot.bypass_rls===true||snapshot.create_db===true||snapshot.create_role===true||snapshot.inherits_neon_superuser===true;
 return {ready:missing.length===0&&!privileged,missing,privileged,
  reason:missing.length?"Schema migration not applied":privileged?"Database owner credentials cannot be runtime role":"Schema exists; manual RLS verification still required"};
}
export async function inspectPreviewComplianceSchema(){
 const connection=process.env.COMPLIANCE_DATABASE_URL;
 const host=process.env.COMPLIANCE_EXPECTED_DB_HOST;
 if(!connection||!host||!host.endsWith(".neon.tech"))throw Error("Preview connection missing");
 const uri=new URL(connection);
 if(uri.hostname!==host||!["postgres:","postgresql:"].includes(uri.protocol)||
    uri.searchParams.get("sslmode")==="disable")throw Error("Untrusted connection");
 const sql=neon(connection);
 const rows=await sql`SELECT (SELECT branch_marker FROM public.compliance_branch_identity WHERE id=1) AS marker,
  to_regclass('public.compliance_remediation_actions')::text AS actions,
  to_regclass('public.compliance_remediation_events')::text AS events,
  to_regclass('public.compliance_organization_memberships')::text AS memberships,
  current_user AS db_role,
  (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS superuser,
  (SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user) AS bypass_rls,
  (SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) AS create_db,
  (SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) AS create_role,
  EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid
    WHERE m.member=(SELECT oid FROM pg_roles WHERE rolname=current_user)
      AND r.rolname='neon_superuser') AS inherits_neon_superuser`;
 return assessSchemaReadiness(rows[0]);
}
if(process.argv[1]?.endsWith("compliance-schema-preflight.mjs")){
 if(process.env.VERCEL_ENV!=="preview"||
  process.env.VERCEL_GIT_COMMIT_REF!=="feature/compliance-guardian")
  throw Error("Preflight must run in dedicated Preview only");
 const result=await inspectPreviewComplianceSchema();
 console.log(JSON.stringify(result));
 if(!result.ready)process.exitCode=1;
}
