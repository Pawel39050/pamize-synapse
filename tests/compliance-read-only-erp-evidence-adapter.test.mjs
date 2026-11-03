import test from "node:test";
import assert from "node:assert/strict";
import {executeSyntheticPurchase} from "../src/lib/compliance/isolated-procurement-worker.ts";
import {auditProcurementEvents} from "../src/lib/compliance/procurement-event-audit.ts";
import {auditWithIndependentErpAdapter} from "../src/lib/compliance/read-only-erp-evidence-adapter.ts";
const events=executeSyntheticPurchase("RUN-ERP-DEMO","normal");
const audit=auditProcurementEvents(events);
const binding={tenantId:"tenant-demo-a",organizationId:"org-demo-a",sourceSystemId:"ERP-DEMO-001",permission:"evidence:read",authenticatedBy:"erp-adapter-server"};
const expectedScope={tenantId:binding.tenantId,organizationId:binding.organizationId,sourceSystemId:binding.sourceSystemId};
const records=events.map((e,i)=>({eventId:e.id,runId:e.runId,kind:e.kind,actorId:e.actorId,evidenceRef:e.evidenceRef,sourceSystemId:binding.sourceSystemId,status:"confirmed",sourceRecordId:"erp-"+(i+1)}));
const call=(overrides={})=>auditWithIndependentErpAdapter({binding,expectedScope,
 repository:{findEvidence:async()=>records},events,audit,...overrides});
test("scoped independent source read provides receipts but never auto-approves",async()=>{
 let seenScope,seenRefs;
 const response=await call({repository:{findEvidence:async(s,refs)=>{seenScope=s;seenRefs=refs;return records}}});
 assert.deepEqual(seenScope,{...expectedScope,runId:audit.runId});
 assert.equal(seenRefs.length,7);
 assert.equal(response.result.matched,7);
 assert.equal(response.result.status,"review-required");
 assert.equal(audit.verifiedSource,false);
});
test("forged or cross-tenant binding is rejected before source lookup",async()=>{
 for(const override of [{tenantId:"other-tenant"},{organizationId:"other-org"},{sourceSystemId:"OTHER-ERP"},{permission:"evidence:write"},{authenticatedBy:"client-claimed"}]){
  let invoked=false;
  await assert.rejects(call({binding:{...binding,...override},
   repository:{findEvidence:async()=>{invoked=true;return records}}}));
  assert.equal(invoked,false);
 }
});
test("no binding or missing repository denies access",async()=>{
 await assert.rejects(call({binding:null}));
 await assert.rejects(call({repository:null}));
});
test("source errors fail closed",async()=>{
 await assert.rejects(call({repository:{findEvidence:async()=>{throw Error("ERP unavailable")}}}));
 await assert.rejects(call({repository:{findEvidence:async()=>null}}));
});
test("source must not return evidence from another run or system",async()=>{
 for(const data of [
  [{...records[0],runId:"RUN-OTHER"}],
  [{...records[0],sourceSystemId:"ERP-OTHER"}],
  [{...records[0],evidenceRef:"reference-not-requested"}]
 ]){
  await assert.rejects(call({repository:{findEvidence:async()=>data}}));
 }
});
test("missing ERP evidence remains a gap",async()=>{
 const r=await call({repository:{findEvidence:async()=>records.slice(1)}});
 assert.equal(r.result.matched,6);
 assert.ok(r.result.issues.some(x=>x.code==="NO_SOURCE_RECEIPT"));
});
test("rejected evidence blocks irrespective of event log",async()=>{
 const r=await call({repository:{findEvidence:async()=>records.map((x,i)=>i===0?{...x,status:"rejected"}:x)}});
 assert.equal(r.result.status,"blocked");
});
test("duplicate source records cannot be treated as a single valid receipt",async()=>{
 const r=await call({repository:{findEvidence:async()=>[...records,records[0]]}});
 assert.ok(r.result.issues.some(x=>x.code==="DUPLICATE_RECEIPT"));
 assert.equal(r.result.status,"blocked");
});
test("no client-supplied document body accepted as ERP receipt",async()=>{
 await assert.rejects(call({repository:{findEvidence:async()=>[{...records[0],documentBody:"confidential"}]}}));
});
