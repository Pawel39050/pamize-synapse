import test from "node:test";
import assert from "node:assert/strict";
import {evaluateComplianceDatabaseSecurity} from "../scripts/compliance-db-security-audit.mjs";
const tables=["compliance_organization_memberships","compliance_remediation_actions","compliance_remediation_events"].map(table_name=>({table_name,rls_enabled:true,rls_forced:true}));
const roles=["compliance_runtime_login_preview","compliance_runtime_restricted_preview"].map(name=>({name,can_login:false,bypass_rls:false,superuser:false,create_db:false,create_role:false,neon_superuser_member:false}));
const policies=[{table_name:"compliance_remediation_actions",policy_name:"preview_action_read_scope",command:"SELECT",roles:["compliance_runtime_restricted_preview"],qualification:"tenant_id = current_setting('app.compliance_tenant_id', true) AND organization_id = current_setting('app.compliance_organization_id', true) AND current_setting('app.compliance_subject_id', true) IS NOT NULL"},{table_name:"compliance_remediation_events",policy_name:"preview_event_read_scope",command:"SELECT",roles:["compliance_runtime_restricted_preview"],qualification:"tenant_id = current_setting('app.compliance_tenant_id', true) AND organization_id = current_setting('app.compliance_organization_id', true) AND current_setting('app.compliance_subject_id', true) IS NOT NULL"}];
test("accepts locked, read-only preview security configuration",()=>assert.equal(evaluateComplianceDatabaseSecurity({tables,roles,policies}).safe,true));
test("rejects BYPASSRLS runtime account",()=>assert.equal(evaluateComplianceDatabaseSecurity({tables,roles:[{...roles[0],bypass_rls:true}],policies}).safe,false));
test("rejects membership access policy",()=>assert.equal(evaluateComplianceDatabaseSecurity({tables,roles,policies:[...policies,{table_name:"compliance_organization_memberships",command:"SELECT"}]}).safe,false));
test("rejects data writes or missing forced RLS",()=>{
 assert.equal(evaluateComplianceDatabaseSecurity({tables,roles,policies:[{table_name:"compliance_remediation_actions",command:"UPDATE"}]}).safe,false);
 assert.equal(evaluateComplianceDatabaseSecurity({tables:tables.map(x=>({...x,rls_forced:false})),roles,policies}).safe,false);
});

test("rejects absent runtime role",()=>{
 assert.equal(evaluateComplianceDatabaseSecurity({tables,roles:[],policies}).safe,false);
});
test("rejects missing scoped read policy",()=>{
 assert.equal(evaluateComplianceDatabaseSecurity({tables,roles,policies:policies.slice(0,1)}).safe,false);
});
test("rejects read policy assigned to wrong database role",()=>{
 assert.equal(evaluateComplianceDatabaseSecurity({tables,roles,policies:[{...policies[0],roles:["PUBLIC"]},policies[1]]}).safe,false);
});

test("rejects RLS policy without tenant or organization predicate",()=>{
 const broken=[{...policies[0],qualification:"true"},policies[1]];
 assert.equal(evaluateComplianceDatabaseSecurity({tables,roles,policies:broken}).safe,false);
});
