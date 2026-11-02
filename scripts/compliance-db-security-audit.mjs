import {neon} from "@neondatabase/serverless";
export function evaluateComplianceDatabaseSecurity(rows){
 const tables=["compliance_organization_memberships","compliance_remediation_actions","compliance_remediation_events"];
 const byName=new Map(rows.tables.map(x=>[x.table_name,x]));
 const failures=[];
 for(const table of tables){
  const record=byName.get(table);
  if(!record?.rls_enabled||!record?.rls_forced)failures.push(table+": RLS not forced");
 }
 for(const role of rows.roles){
  if(role.can_login||role.bypass_rls||role.superuser||role.create_db||role.create_role||role.neon_superuser_member)
   failures.push(role.name+": privileged or active");
 }
 const requiredRoles=["compliance_runtime_login_preview","compliance_runtime_restricted_preview"];
 for(const name of requiredRoles){if(rows.roles.filter(r=>r.name===name).length!==1)failures.push(name+": missing or duplicate role");}
 const policies=rows.policies;
 if(policies.some(p=>p.command!=="SELECT"))failures.push("Non-read-only policy exists");
 if(policies.some(p=>p.table_name==="compliance_organization_memberships"))
  failures.push("Membership table unexpectedly exposed");
 const expectedPolicies=[["compliance_remediation_actions","preview_action_read_scope"],["compliance_remediation_events","preview_event_read_scope"]];
 for(const [table,name] of expectedPolicies){
  if(policies.filter(p=>p.table_name===table&&p.policy_name===name&&p.command==="SELECT"&&p.roles?.length===1&&p.roles[0]==="compliance_runtime_restricted_preview"&&["app.compliance_tenant_id","app.compliance_organization_id","app.compliance_subject_id"].every(key=>typeof p.qualification==="string"&&p.qualification.includes(key))).length!==1)
   failures.push(name+": missing or misconfigured policy");
 }
 if(policies.length!==expectedPolicies.length)failures.push("Unexpected additional policy");
 return {safe:failures.length===0,failures};
}
/** Run only with dedicated Preview database credentials. Read-only catalog inspection.
 * A safe report is NOT proof of isolation without an authenticated runtime connection test. */
export async function inspectComplianceDatabaseSecurity(sql){
 const [tables,roles,policies]=await Promise.all([
  sql`SELECT c.relname AS table_name,c.relrowsecurity AS rls_enabled,c.relforcerowsecurity AS rls_forced
   FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
   AND c.relname IN ('compliance_organization_memberships','compliance_remediation_actions','compliance_remediation_events')`,
  sql`SELECT r.rolname AS name,r.rolcanlogin AS can_login,r.rolbypassrls AS bypass_rls,
   r.rolsuper AS superuser,r.rolcreatedb AS create_db,r.rolcreaterole AS create_role,
   EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles g ON g.oid=m.roleid
    WHERE m.member=r.oid AND g.rolname='neon_superuser') AS neon_superuser_member
   FROM pg_roles r WHERE r.rolname IN ('compliance_runtime_login_preview','compliance_runtime_restricted_preview')`,
  sql`SELECT tablename AS table_name,policyname AS policy_name,cmd AS command,roles,qual AS qualification FROM pg_policies WHERE schemaname='public'
   AND tablename IN ('compliance_organization_memberships','compliance_remediation_actions','compliance_remediation_events')`
 ]);
 return evaluateComplianceDatabaseSecurity({tables,roles,policies});
}
