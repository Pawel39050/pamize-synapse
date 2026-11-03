import test from "node:test";
import assert from "node:assert/strict";
import {assertSafeAgentReplayRole,RESTRICTED_AGENT_ROLE_PREFLIGHT_SQL} from "../src/lib/compliance/agent-replay-role-preflight.ts";
const good={roleName:"compliance_agent_replay_rls_probe",canLogin:false,bypassRls:false,superuser:false,canCreateRole:false,canCreateDb:false,rlsEnabled:true,rlsForced:true};
test("restrict database role and require forced RLS",()=>{
 assert.doesNotThrow(()=>assertSafeAgentReplayRole(good,good.roleName));
 assert.match(RESTRICTED_AGENT_ROLE_PREFLIGHT_SQL,/pg_roles/);
});
for(const [field,bad] of [
 ["canLogin",true],["bypassRls",true],["superuser",true],["canCreateRole",true],
 ["canCreateDb",true],["rlsEnabled",false],["rlsForced",false]
]){
 test("deny unsafe database role: "+field,()=>{
  assert.throws(()=>assertSafeAgentReplayRole({...good,[field]:bad},good.roleName));
 });
}
test("deny unknown or mismatched database roles",()=>{
 assert.throws(()=>assertSafeAgentReplayRole(null,good.roleName));
 assert.throws(()=>assertSafeAgentReplayRole(good,"another-role"));
});
test("actual Neon role anomaly is not acceptable",()=>{
 assert.throws(()=>assertSafeAgentReplayRole({...good,roleName:"compliance_agent_replay_org_a_test",canLogin:true,bypassRls:true,canCreateRole:true,canCreateDb:true},"compliance_agent_replay_org_a_test"));
});
