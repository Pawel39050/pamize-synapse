import test from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {checkInternalAgentEventRequest} from "../src/lib/compliance/internal-agent-event-service.ts";
import {signProcurementBatch} from "../src/lib/compliance/signed-agent-event-channel.ts";
import {PROCUREMENT_EVENT_SCENARIOS} from "../src/lib/compliance/procurement-event-audit.ts";
const init=()=>{
 const now=Date.now(),secret=randomBytes(32),scope={tenantId:"tenant-demo-a",organizationId:"org-demo-a",agentKey:"AG-PRC-001"};
 const keyId="key-demo-1";
 const envelope=signProcurementBatch({version:"1",...scope,issuedAt:now,nonce:randomBytes(24).toString("base64url"),payload:JSON.stringify({schemaVersion:"1",agentKey:"AG-PRC-001",events:PROCUREMENT_EVENT_SCENARIOS[0].events})},secret);
 const record={...scope,keyId,secret,status:"active",validFrom:now-10000,validUntil:now+10000};
 const seen=new Set();
 const replayExecutor={insertOnce:async(_sql,params)=>{
  const id=params.slice(0,4).join(":");
  if(seen.has(id))return {rows:[]};
  seen.add(id);return {rows:[{nonce:params[3]}]};
 }};
 const lookup={resolve:async()=>record};
 const safeRole={roleName:"compliance_agent_replay_rls_probe",canLogin:false,bypassRls:false,superuser:false,canCreateRole:false,canCreateDb:false,rlsEnabled:true,rlsForced:true};
 const databaseRoleFacts=async()=>safeRole;
 return {request:{keyId,envelope},lookup,replayExecutor,databaseRoleFacts,verifiedExpectedScope:scope,now,record,safeRole};
};
test("valid internal request still does not authenticate ERP evidence",async()=>{
 const a=init();const r=await checkInternalAgentEventRequest(a);
 assert.equal(r.transportedByAuthenticatedAgent,true);
 assert.equal(r.verifiedBusinessEvidence,false);
 assert.equal(r.localReview.audit.verifiedSource,false);
});
test("same nonce rejected on replay",async()=>{
 const a=init();await checkInternalAgentEventRequest(a);
 await assert.rejects(checkInternalAgentEventRequest(a));
});
test("disabled, expired or mismatched credential rejected",async()=>{
 for(const change of [{status:"disabled"},{validUntil:0},{organizationId:"org-demo-b"},{secret:randomBytes(32)}]){
  const a=init();a.lookup={resolve:async()=>({...a.record,...change})};
  await assert.rejects(checkInternalAgentEventRequest(a));
 }
});
test("request envelope must match independent verified scope",async()=>{
 const a=init();a.verifiedExpectedScope={...a.verifiedExpectedScope,organizationId:"org-demo-b"};
 await assert.rejects(checkInternalAgentEventRequest(a));
});
test("credential lookup failure does not allow ingestion",async()=>{
 const a=init();a.lookup={resolve:async()=>{throw Error("key service unavailable")}};
 await assert.rejects(checkInternalAgentEventRequest(a));
});
test("database failures do not authorize ingestion",async()=>{
 const a=init();a.replayExecutor={insertOnce:async()=>{throw Error("db unavailable")}};
 await assert.rejects(checkInternalAgentEventRequest(a));
});
test("unknown key id rejected",async()=>{
 const a=init();a.request.keyId="key-other";
 await assert.rejects(checkInternalAgentEventRequest(a));
});

test("role preflight rejects bypass RLS and login privileges",async()=>{
 for(const unsafe of [{bypassRls:true},{canLogin:true},{canCreateDb:true},{rlsForced:false}]){
  const a=init();a.databaseRoleFacts=async()=>({...a.safeRole,...unsafe});
  await assert.rejects(checkInternalAgentEventRequest(a));
 }
});
test("unavailable database role information prevents nonce reservation",async()=>{
 const a=init();let called=false;
 a.databaseRoleFacts=async()=>null;
 a.replayExecutor={insertOnce:async()=>{called=true;return {rows:[]}}};
 await assert.rejects(checkInternalAgentEventRequest(a));
 assert.equal(called,false);
});
