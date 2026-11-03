import test from "node:test";
import assert from "node:assert/strict";
import {makeSessionBoundErpRepository,ERP_SESSION_PROBE_SQL} from "../src/lib/compliance/session-bound-erp-repository.ts";
import {ERP_EVIDENCE_READ_SQL} from "../src/lib/compliance/neon-read-only-erp-repository.ts";

const role="compliance_erp_reader_preview";
const safe={currentUser:role,sessionUser:role,sessionCanLogin:true,
 sessionBypassRls:false,sessionSuperuser:false,sessionCreateRole:false,
 sessionCreateDb:false,activeBypassRls:false,rlsEnabled:true,rlsForced:true,
 canRead:true,canInsert:false,canUpdate:false,canDelete:false};
const scope={tenantId:"tenant-test-a",organizationId:"org-test-a",
 sourceSystemId:"ERP-DEMO-001",runId:"RUN-DEMO-ERP"};
const receipt={eventId:"event-1",runId:scope.runId,kind:"request-created",
 actorId:"requester-demo",evidenceRef:"synthetic-request-created",
 sourceSystemId:scope.sourceSystemId,status:"confirmed",sourceRecordId:"erp-evidence-a-1"};
const fixture=(identity=safe,rows=[receipt])=>{
 const calls=[];
 const provider={expectedLoginRole:role,withReadOnlySession:async callback=>{
  calls.push("begin");
  try{return await callback({
   identity:async sql=>{assert.equal(sql,ERP_SESSION_PROBE_SQL);calls.push("identity");return identity},
   select:async(sql,params)=>{assert.equal(sql,ERP_EVIDENCE_READ_SQL);
    calls.push({params});return {rows}}
  });}finally{calls.push("end")}
 }};
 return {repository:makeSessionBoundErpRepository(provider),calls};
};

test("checks dedicated login then reads in the same callback",async()=>{
 const {repository,calls}=fixture();
 const rows=await repository.findEvidence(scope,[receipt.evidenceRef]);
 assert.deepEqual(rows,[receipt]);
 assert.deepEqual(calls.slice(0,2),["begin","identity"]);
 assert.deepEqual(calls[2].params,[scope.tenantId,scope.organizationId,
  scope.sourceSystemId,scope.runId,[receipt.evidenceRef]]);
 assert.equal(calls[3],"end");
});
test("administrator-backed SET ROLE fails before SELECT",async()=>{
 const {repository,calls}=fixture({...safe,currentUser:role,sessionUser:"neondb_owner",
  sessionBypassRls:true,sessionCreateDb:true});
 await assert.rejects(repository.findEvidence(scope,[receipt.evidenceRef]));
 assert.deepEqual(calls,["begin","identity","end"]);
});
test("RLS bypass and write privilege each fail before read",async()=>{
 for(const defect of [{sessionBypassRls:true},{activeBypassRls:true},
  {canInsert:true},{canUpdate:true},{canDelete:true},{rlsForced:false}]){
  const {repository,calls}=fixture({...safe,...defect});
  await assert.rejects(repository.findEvidence(scope,[receipt.evidenceRef]));
  assert.deepEqual(calls,["begin","identity","end"]);
 }
});
test("missing session identity fails closed",async()=>{
 const {repository,calls}=fixture(null);
 await assert.rejects(repository.findEvidence(scope,[receipt.evidenceRef]));
 assert.deepEqual(calls,["begin","identity","end"]);
});
test("cross-run evidence cannot be accepted",async()=>{
 const {repository}=fixture(safe,[{...receipt,runId:"RUN-OTHER"}]);
 await assert.rejects(repository.findEvidence(scope,[receipt.evidenceRef]));
});
test("input validation occurs before opening any session",async()=>{
 const {repository,calls}=fixture();
 await assert.rejects(repository.findEvidence({...scope,tenantId:"bad tenant"},[receipt.evidenceRef]));
 await assert.rejects(repository.findEvidence(scope,["secret document name"]));
 assert.deepEqual(calls,[]);
});
test("empty evidence list still requires a verified session",async()=>{
 const {repository,calls}=fixture();
 assert.deepEqual(await repository.findEvidence(scope,[]),[]);
 assert.deepEqual(calls,["begin","identity","end"]);
});
test("fake privileged provider marker cannot create reader",()=>{
 assert.throws(()=>makeSessionBoundErpRepository({
  expectedLoginRole:"neondb_owner",withReadOnlySession:async()=>[]
 }));
});
