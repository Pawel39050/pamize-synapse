import test from "node:test";
import assert from "node:assert/strict";
import {makeRestrictedReplayRegistry,REPLAY_INSERT_SQL} from "../src/lib/compliance/restricted-replay-registry.ts";
const scope="tenant-preview-a:organization-preview-a:AG-PRC-001";
const nonce="safe_nonce_123456789012345678";
test("replay registry records atomic insertion and denies duplicate",async()=>{
 const seen=new Set();
 const reg=makeRestrictedReplayRegistry({insertOnce:async(sql,params)=>{
  assert.equal(sql,REPLAY_INSERT_SQL);
  assert.match(sql,/ON CONFLICT/);
  assert.equal(params[0],"tenant-preview-a");assert.equal(params[1],"organization-preview-a");
  const key=params.slice(0,4).join(":");if(seen.has(key))return {rows:[]};
  seen.add(key);return {rows:[{nonce:params[3]}]};
 }});
 assert.equal(await reg.reserveOnce(scope,nonce,Date.now()+60000),true);
 assert.equal(await reg.reserveOnce(scope,nonce,Date.now()+60000),false);
});
test("invalid scopes and expired nonce fail closed before database",async()=>{
 const reg=makeRestrictedReplayRegistry({insertOnce:async()=>{throw Error("unexpected DB") }});
 for(const value of ["tenant-preview-a:AG-PRC-001","tenant-preview-a:org-b:OTHER","tenant:org:AG-PRC-001:extra","tenant bad:org-b:AG-PRC-001"]){
  await assert.rejects(reg.reserveOnce(value,nonce,Date.now()+60000));
 }
 await assert.rejects(reg.reserveOnce(scope,"short",Date.now()+60000));
 await assert.rejects(reg.reserveOnce(scope,nonce,Date.now()-1000));
});
test("database failures propagate; never accept as success",async()=>{
 const reg=makeRestrictedReplayRegistry({insertOnce:async()=>{throw Error("db unavailable")}});
 await assert.rejects(reg.reserveOnce(scope,nonce,Date.now()+60000),/db unavailable/);
});
test("invalid database acknowledgement cannot authorize a request",async()=>{
 const reg=makeRestrictedReplayRegistry({insertOnce:async()=>({rows:[{nonce:"another"}]})});
 await assert.rejects(reg.reserveOnce(scope,nonce,Date.now()+60000));
});
test("executor is mandatory",()=>assert.throws(()=>makeRestrictedReplayRegistry(null)));
