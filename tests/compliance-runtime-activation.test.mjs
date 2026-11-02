import test from "node:test";
import assert from "node:assert/strict";
import {assessRuntimeActivation} from "../src/lib/compliance/runtime-activation-gate.ts";
const role={name:"compliance_runtime_login_preview",canLogin:false,bypassRls:false,superuser:false,createDb:false,createRole:false,inheritsNeonSuperuser:false};
test("real Preview state is safe but not activated",()=>{
 const result=assessRuntimeActivation({role,restrictedRls:true,runtimeCanReadScopedData:true,membershipVerified:false,transactionIsolationTested:false});
 assert.equal(result.ready,false);assert.ok(result.blockers.includes("Runtime role has NOLOGIN"));
});
test("even with login, unverified membership prevents activation",()=>{
 const result=assessRuntimeActivation({role:{...role,canLogin:true},restrictedRls:true,runtimeCanReadScopedData:true,membershipVerified:false,transactionIsolationTested:true});
 assert.equal(result.ready,false);
});
test("privileged role cannot activate regardless of tests",()=>{
 const result=assessRuntimeActivation({role:{...role,canLogin:true,bypassRls:true},restrictedRls:true,runtimeCanReadScopedData:true,membershipVerified:true,transactionIsolationTested:true});
 assert.equal(result.ready,false);
});
test("accepts only completely verified least-privilege setup",()=>{
 const result=assessRuntimeActivation({role:{...role,canLogin:true},restrictedRls:true,runtimeCanReadScopedData:true,membershipVerified:true,transactionIsolationTested:true});
 assert.equal(result.ready,true);
});

test("rejects login that cannot read scoped tables",()=>{
 const result=assessRuntimeActivation({role:{...role,canLogin:true},restrictedRls:true,runtimeCanReadScopedData:false,membershipVerified:true,transactionIsolationTested:true});
 assert.equal(result.ready,false);
 assert.ok(result.blockers.some(x=>x.includes("SELECT")));
});
