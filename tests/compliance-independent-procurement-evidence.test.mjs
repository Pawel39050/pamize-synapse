import test from "node:test";
import assert from "node:assert/strict";
import {executeSyntheticPurchase} from "../src/lib/compliance/isolated-procurement-worker.ts";
import {auditProcurementEvents} from "../src/lib/compliance/procurement-event-audit.ts";
import {reconcileIndependentSourceEvidence} from "../src/lib/compliance/independent-procurement-evidence.ts";
const events=executeSyntheticPurchase("RUN-EVIDENCE","normal");
const audit=auditProcurementEvents(events);
const receipts=events.map((e,i)=>({
 eventId:e.id,runId:e.runId,kind:e.kind,actorId:e.actorId,evidenceRef:e.evidenceRef,
 sourceSystemId:"ERP-DEMO-001",status:"confirmed",sourceRecordId:"erp-rec-"+(i+1)
}));
const check=(overrides={})=>reconcileIndependentSourceEvidence({
 events,receipts,trustedSourceSystemId:"ERP-DEMO-001",sourceAuthenticated:true,audit,...overrides
});
test("all matching independently asserted receipts reconciled but review still required",()=>{
 const r=check();assert.equal(r.matched,7);assert.equal(r.expected,7);
 assert.equal(r.status,"review-required");assert.equal(r.issues.length,0);
 assert.equal(audit.verifiedSource,false);
});
test("source cannot be treated as verified without authentication",()=>{
 const r=check({sourceAuthenticated:false});
 assert.equal(r.matched,0);
 assert.ok(r.issues.some(x=>x.code==="SOURCE_NOT_AUTHENTICATED"));
 assert.equal(r.status,"review-required");
});
test("missing source receipt is an evidence gap",()=>{
 const r=check({receipts:receipts.slice(1)});
 assert.equal(r.matched,6);
 assert.ok(r.issues.some(x=>x.code==="NO_SOURCE_RECEIPT"));
});
test("source rejection blocks",()=>{
 const r=check({receipts:receipts.map((x,i)=>i===0?{...x,status:"rejected"}:x)});
 assert.equal(r.status,"blocked");assert.ok(r.issues.some(x=>x.code==="SOURCE_REJECTED"));
});
test("source and agent disagreement blocks",()=>{
 for(const modification of [{actorId:"different-agent"},{evidenceRef:"other-document"},{sourceSystemId:"OTHER-ERP"},{kind:"order-sent"}]){
  const altered=receipts.map((r,i)=>i===1?{...r,...modification}:r);
  const result=check({receipts:altered});
  assert.equal(result.status,"blocked");
  assert.ok(result.issues.some(x=>x.code==="RECEIPT_MISMATCH"));
 }
});
test("duplicate and unexpected receipts block",()=>{
 assert.ok(check({receipts:[...receipts,receipts[0]]}).issues.some(x=>x.code==="DUPLICATE_RECEIPT"));
 const extra={...receipts[0],eventId:"event-unlisted"};
 assert.equal(check({receipts:[...receipts,extra]}).status,"blocked");
});
test("malformed receipt fields fail closed",()=>{
 assert.throws(()=>check({receipts:[{...receipts[0],documentBody:"private data"}]}));
 assert.throws(()=>check({receipts:[{...receipts[0],evidenceRef:"personal name"}]}));
});
test("worker failed policy stays blocked despite all source receipts",()=>{
 const bad=executeSyntheticPurchase("RUN-ORDER-FAIL","early-order");
 const r=reconcileIndependentSourceEvidence({events:bad,
  receipts:bad.map((e,i)=>({...receipts[0],eventId:e.id,runId:e.runId,kind:e.kind,actorId:e.actorId,evidenceRef:e.evidenceRef,sourceRecordId:"erp-rec-"+i})),
  trustedSourceSystemId:"ERP-DEMO-001",sourceAuthenticated:true,audit:auditProcurementEvents(bad)});
 assert.equal(r.status,"blocked");
});
test("missing worker evidence cannot be cured by receipt alone",()=>{
 const bad=executeSyntheticPurchase("RUN-NO-REFERENCE","missing-evidence");
 const r=reconcileIndependentSourceEvidence({events:bad,receipts:[],
  trustedSourceSystemId:"ERP-DEMO-001",sourceAuthenticated:true,audit:auditProcurementEvents(bad)});
 assert.ok(r.issues.some(x=>x.code==="MISSING_EVIDENCE_REFERENCE"));
});
