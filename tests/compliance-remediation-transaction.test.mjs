import test from "node:test";
import assert from "node:assert/strict";
import {commitRemediationTransition} from "../src/lib/compliance/remediation-transaction-coordinator.ts";
const id="11111111-1111-4111-8111-111111111111",eventId="22222222-2222-4222-8222-222222222222";
const principal={issuer:"entra-id-verified",subject:"owner",tenantId:"tenant",organizationIds:["org"],roles:["author"]};
const input={principal,tenantId:"tenant",organizationId:"org",actionId:id,expectedRevision:1,expectedState:"assigned",nextState:"in-progress",eventId,eventHash:"a".repeat(64),previousHash:null,occurredAt:"2026-11-02T10:00:00Z"};
function fake({failInsert=false,owner="owner"}={}){
 const calls=[];let released=false;
 const provider={async connect(){return {
  async query(sql,params){calls.push({sql,params});if(sql.startsWith("SELECT state"))return {rows:[{state:"assigned",revision:1,owner_id:owner}],rowCount:1};
   if(sql.startsWith("UPDATE"))return {rows:[],rowCount:1};
   if(sql.startsWith("SELECT event_number"))return {rows:[],rowCount:0};
   if(failInsert&&sql.startsWith("INSERT"))throw Error("Insert failed");
   return {rows:[],rowCount:1};
  },release(){released=true;}
 }}};
 return {provider,calls,released:()=>released};
}
test("successful transaction commits scoped action and audit atomically",async()=>{
 const f=fake();const result=await commitRemediationTransition(input,f.provider);
 assert.deepEqual(result,{revision:2,eventNumber:1});
 assert.equal(f.calls[0].sql,"BEGIN");
 assert.equal(f.calls.at(-1).sql,"COMMIT");
 assert.ok(f.calls.some(c=>c.sql.startsWith("INSERT")));
 assert.equal(f.released(),true);
});
test("failed event insert rolls back the action update",async()=>{
 const f=fake({failInsert:true});
 await assert.rejects(commitRemediationTransition(input,f.provider),/Insert failed/);
 assert.equal(f.calls.at(-1).sql,"ROLLBACK");
 assert.equal(f.released(),true);
});
test("cross organization permission check runs before connecting",async()=>{
 const f=fake();
 await assert.rejects(commitRemediationTransition({...input,organizationId:"other"},f.provider),/Forbidden/);
 assert.equal(f.calls.length,0);
});
test("only assigned owner can progress",async()=>{
 const f=fake({owner:"someone-else"});
 await assert.rejects(commitRemediationTransition(input,f.provider),/Only owner/);
 assert.equal(f.calls.at(-1).sql,"ROLLBACK");
});
