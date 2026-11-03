import test from "node:test";
import assert from "node:assert/strict";
import {auditProcurementEvents,PROCUREMENT_EVENT_SCENARIOS} from "../src/lib/compliance/procurement-event-audit.ts";
const pick=id=>PROCUREMENT_EVENT_SCENARIOS.find(x=>x.id===id).events;
test("complete synthetic sequence still requires source verification",()=>{
 const r=auditProcurementEvents(pick("RUN-001"));
 assert.equal(r.status,"review-required");assert.equal(r.verifiedSource,false);
 assert.deepEqual(r.findings.map(x=>x.code),["UNVERIFIED_SOURCE"]);
});
for(const [id,code] of [
 ["RUN-002","ORDER_BEFORE_APPROVAL"],["RUN-003","MISSING_HUMAN_APPROVAL"],
 ["RUN-004","SELF_APPROVAL"],["RUN-005","MISSING_EVIDENCE"],
 ["RUN-006","INVALID_SEQUENCE"]]){
 test(id+" triggers "+code,()=>{const r=auditProcurementEvents(pick(id));
  assert.ok(r.findings.some(x=>x.code===code));assert.equal(r.humanApprovalRequired,true);
 });
}
test("duplicate event IDs fail closed",()=>{
 const events=[...pick("RUN-001")];events[2]={...events[2],id:events[1].id};
 assert.ok(auditProcurementEvents(events).findings.some(x=>x.code==="DUPLICATE_EVENT"));
});
test("mixed execution run identifiers are rejected",()=>{
 const events=[...pick("RUN-001")];events[2]={...events[2],runId:"OTHER"};
 assert.throws(()=>auditProcurementEvents(events));
});
test("invalid timestamps are rejected",()=>{
 const events=[...pick("RUN-001")];events[0]={...events[0],at:"not-a-date"};
 assert.throws(()=>auditProcurementEvents(events));
});
test("every event run includes an unverifiable-source warning",()=>{
 for(const c of PROCUREMENT_EVENT_SCENARIOS){
  const result=auditProcurementEvents(c.events);
  assert.ok(result.findings.some(f=>f.code==="UNVERIFIED_SOURCE"));
  assert.equal(result.verifiedSource,false);
 }
});
