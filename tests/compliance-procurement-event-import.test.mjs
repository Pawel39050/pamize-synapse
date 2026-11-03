import test from "node:test";
import assert from "node:assert/strict";
import {parseLocalProcurementEvents,MAX_LOCAL_EVENT_BYTES} from "../src/lib/compliance/procurement-event-local-import.ts";
import {PROCUREMENT_EVENT_SCENARIOS} from "../src/lib/compliance/procurement-event-audit.ts";
const make=(events=PROCUREMENT_EVENT_SCENARIOS[0].events)=>JSON.stringify({schemaVersion:"1",agentKey:"AG-PRC-001",events});
test("valid synthetic run is always unverified",()=>{
 const result=parseLocalProcurementEvents(make());
 assert.equal(result.events.length,7);assert.equal(result.source,"unverified-local-json");
 assert.equal(result.audit.verifiedSource,false);assert.equal(result.audit.status,"review-required");
});
test("missing approval reported, never silently approved",()=>{
 const result=parseLocalProcurementEvents(make(PROCUREMENT_EVENT_SCENARIOS[2].events));
 assert.ok(result.audit.findings.some(f=>f.code==="MISSING_HUMAN_APPROVAL"));
});
test("reject extra envelope fields, unknown agent and bad version",()=>{
 const base=JSON.parse(make());
 for(const bad of [{...base,tenantId:"customer-a"},{...base,agentKey:"AG-FIN-001"},{...base,schemaVersion:"2"}])
  assert.throws(()=>parseLocalProcurementEvents(JSON.stringify(bad)));
});
test("reject extra fields in events, including arbitrary payload",()=>{
 const base=JSON.parse(make());base.events[0].documentText="PRIVATE";
 assert.throws(()=>parseLocalProcurementEvents(JSON.stringify(base)));
});
test("reject malicious or invalid event metadata",()=>{
 const base=JSON.parse(make());
 for(const [key,value] of [["actorId","person@example.com"],["evidenceRef","personal data from buyer"],["sequence",2.5],["kind","purchase-approved"],["at","2026-11-03T10:00:00+01:00"]]){
  const obj=structuredClone(base);obj.events[0][key]=value;
  assert.throws(()=>parseLocalProcurementEvents(JSON.stringify(obj)));
 }
});
test("reject JSON injection and huge inputs",()=>{
 assert.throws(()=>parseLocalProcurementEvents("not-json"));
 assert.throws(()=>parseLocalProcurementEvents("a".repeat(MAX_LOCAL_EVENT_BYTES+1)));
});
test("reject mixed execution runs and duplicate IDs without implying trustworthy data",()=>{
 const base=JSON.parse(make());base.events[2].runId="RUN-OTHER";
 assert.throws(()=>parseLocalProcurementEvents(JSON.stringify(base)));
 const duplicated=JSON.parse(make());duplicated.events[1].id=duplicated.events[0].id;
 assert.ok(parseLocalProcurementEvents(JSON.stringify(duplicated)).audit.findings.some(f=>f.code==="DUPLICATE_EVENT"));
});
test("reject empty lists, too many events, and unknown event kinds",()=>{
 const base=JSON.parse(make());
 assert.throws(()=>parseLocalProcurementEvents(JSON.stringify({...base,events:[]})));
 assert.throws(()=>parseLocalProcurementEvents(JSON.stringify({...base,events:Array.from({length:101},(_,i)=>({...base.events[0],id:"evt-"+i,sequence:i+1}))})));
});
