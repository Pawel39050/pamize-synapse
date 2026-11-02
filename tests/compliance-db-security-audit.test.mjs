import test from "node:test";
import assert from "node:assert/strict";
import {evaluateComplianceDatabaseSecurity} from "../scripts/compliance-db-security-audit.mjs";
const tables=["compliance_organization_memberships","compliance_remediation_actions","compliance_remediation_events"].map(table_name=>({table_name,rls_enabled:true,rls_forced:true}));
const roles=["compliance_runtime_login_preview","compliance_runtime_restricted_preview"].map(name=>({name,can_login:false,bypass_rls:false,superuser:false,create_db:false,create_role:false,neon_superuser_member:false}));
const policies=[{table_name:"compliance_remediation_actions",command:"SELECT"},{table_name:"compliance_remediation_events",command:"SELECT"}];
test("accepts locked, read-only preview security configuration",()=>assert.equal(evaluateComplianceDatabaseSecurity({tables,roles,policies}).safe,true));
test("rejects BYPASSRLS runtime account",()=>assert.equal(evaluateComplianceDatabaseSecurity({tables,roles:[{...roles[0],bypass_rls:true}],policies}).safe,false));
test("rejects membership access policy",()=>assert.equal(evaluateComplianceDatabaseSecurity({tables,roles,policies:[...policies,{table_name:"compliance_organization_memberships",command:"SELECT"}]}).safe,false));
test("rejects data writes or missing forced RLS",()=>{
 assert.equal(evaluateComplianceDatabaseSecurity({tables,roles,policies:[{table_name:"compliance_remediation_actions",command:"UPDATE"}]}).safe,false);
 assert.equal(evaluateComplianceDatabaseSecurity({tables:tables.map(x=>({...x,rls_forced:false})),roles,policies}).safe,false);
});
