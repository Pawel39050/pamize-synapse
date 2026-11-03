import test from "node:test";
import assert from "node:assert/strict";
import {makeNeonReadOnlyErpRepository,ERP_EVIDENCE_READ_SQL} from "../src/lib/compliance/neon-read-only-erp-repository.ts";
const role={roleName:"compliance_agent_replay_rls_probe",canLogin:false,bypassRls:false,
 superuser:false,canCreateRole:false,canCreateDb:false,rlsEnabled:true,rlsForced:true};
const scope={tenantId:"tenant-test-a",organizationId:"org-test-a",
 sourceSystemId:"ERP-DEMO-001",runId:"RUN-DEMO-ERP"};
const receipt={eventId:"event-1",runId:scope.runId,kind:"request-created",actorId:"requester-demo",
 evidenceRef:"synthetic-request-created",sourceSystemId:scope.sourceSystemId,status:"confirmed",
 sourceRecordId:"erp-evidence-a-1"};
const setup=(overrides={})=>{
 const observed=[];
 const executor={verifiedRole:"compliance_agent_replay_rls_probe",facts:async()=>role,
  read:async(sql,params)=>{observed.push({sql,params});return {rows:[receipt]}} ,...overrides};
 return {repository:makeNeonReadOnlyErpRepository(executor),observed};
};
test("SQL is restricted SELECT and uses placeholders",()=>{
 assert.match(ERP_EVIDENCE_READ_SQL,/^SELECT/);
 assert.match(ERP_EVIDENCE_READ_SQL,/tenant_id=\$1/);
 assert.match(ERP_EVIDENCE_READ_SQL,/organization_id=\$2/);
 assert.match(ERP_EVIDENCE_READ_SQL,/evidence_ref=ANY\(\$5::text\[\]\)/);
 assert.doesNotMatch(ERP_EVIDENCE_READ_SQL,/INSERT|UPDATE|DELETE|DROP/i);
});
test("read uses all server-verified scope fields",async()=>{
 const {repository,observed}=setup();
 const r=await repository.findEvidence(scope,[receipt.evidenceRef]);
 assert.deepEqual(r,[receipt]);assert.equal(observed.length,1);
 assert.deepEqual(observed[0].params,[scope.tenantId,scope.organizationId,scope.sourceSystemId,scope.runId,[receipt.evidenceRef]]);
});
test("unsafe role refuses before SQL query",async()=>{
 let called=false;
 const {repository}=setup({facts:async()=>({...role,bypassRls:true}),
  read:async()=>{called=true;return {rows:[]}}});
 await assert.rejects(repository.findEvidence(scope,[receipt.evidenceRef]));
 assert.equal(called,false);
});
test("no role facts fails closed",async()=>{
 const {repository}=setup({facts:async()=>null});
 await assert.rejects(repository.findEvidence(scope,[receipt.evidenceRef]));
});
test("out of scope receipts are denied",async()=>{
 for(const modification of [{runId:"other-run"},{sourceSystemId:"OTHER-ERP"},{evidenceRef:"not-requested"}]){
  const {repository}=setup({read:async()=>({rows:[{...receipt,...modification}]})});
  await assert.rejects(repository.findEvidence(scope,[receipt.evidenceRef]));
 }
});
test("invalid input does not query database",async()=>{
 let called=false;
 const {repository}=setup({read:async()=>{called=true;return {rows:[]}}});
 await assert.rejects(repository.findEvidence({...scope,organizationId:"bad org"},[receipt.evidenceRef]));
 await assert.rejects(repository.findEvidence(scope,["private data"]));
 assert.equal(called,false);
});
test("database outage and oversized response both fail closed",async()=>{
 const {repository:offline}=setup({read:async()=>{throw Error("connection unavailable")}});
 await assert.rejects(offline.findEvidence(scope,[receipt.evidenceRef]));
 const {repository:oversized}=setup({read:async()=>({rows:Array(101).fill(receipt)})});
 await assert.rejects(oversized.findEvidence(scope,[receipt.evidenceRef]));
});
test("empty reference list performs no read",async()=>{
 const {repository,observed}=setup();
 const r=await repository.findEvidence(scope,[]);
 assert.deepEqual(r,[]);assert.equal(observed.length,0);
});
test("cannot instantiate with admin-connection marker",()=>{
 assert.throws(()=>makeNeonReadOnlyErpRepository({verifiedRole:"neondb_owner",facts:async()=>role,read:async()=>({rows:[]})}));
});
