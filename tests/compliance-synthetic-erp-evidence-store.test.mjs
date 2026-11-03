import test from "node:test";
import assert from "node:assert/strict";
import {executeSyntheticPurchase} from "../src/lib/compliance/isolated-procurement-worker.ts";
import {auditProcurementEvents} from "../src/lib/compliance/procurement-event-audit.ts";
import {auditWithIndependentErpAdapter} from "../src/lib/compliance/read-only-erp-evidence-adapter.ts";
import {createSyntheticErpEvidenceRepository} from "../src/lib/compliance/synthetic-erp-evidence-store.ts";

const events=executeSyntheticPurchase("RUN-ERP-TEST","normal");
const binding={tenantId:"tenant-demo-a",organizationId:"org-demo-a",sourceSystemId:"ERP-DEMO-001",
 permission:"evidence:read",authenticatedBy:"erp-adapter-server"};
const expectedScope={tenantId:binding.tenantId,organizationId:binding.organizationId,sourceSystemId:binding.sourceSystemId};
const seeded=events.map((event,i)=>({
 tenantId:binding.tenantId,organizationId:binding.organizationId,
 eventId:event.id,runId:event.runId,kind:event.kind,actorId:event.actorId,
 evidenceRef:event.evidenceRef,sourceSystemId:binding.sourceSystemId,
 sourceRecordId:"erp-row-"+(i+1),status:"confirmed"
}));
const verify=(repository,options={})=>auditWithIndependentErpAdapter({
 binding,expectedScope,repository,events,audit:auditProcurementEvents(events),...options
});

test("independently seeded evidence matches executed purchase without auto approval",async()=>{
 const repository=createSyntheticErpEvidenceRepository(seeded);
 const r=await verify(repository);
 assert.equal(r.result.matched,7);
 assert.equal(r.result.issues.length,0);
 assert.equal(r.result.status,"review-required");
});
test("separate organizations and tenants cannot see each others source rows",async()=>{
 const repository=createSyntheticErpEvidenceRepository([
  ...seeded.map(row=>({...row,organizationId:"org-demo-b",tenantId:"tenant-demo-b"}))
 ]);
 const r=await verify(repository);
 assert.equal(r.result.matched,0);
 assert.equal(r.result.issues.filter(x=>x.code==="NO_SOURCE_RECEIPT").length,7);
});
test("source record rejection prevents clean reconciliation",async()=>{
 const repo=createSyntheticErpEvidenceRepository(seeded.map((x,i)=>i===0?{...x,status:"rejected"}:x));
 const r=await verify(repo);
 assert.equal(r.result.status,"blocked");
 assert.ok(r.result.issues.some(x=>x.code==="SOURCE_REJECTED"));
});
test("independent source mismatch blocks despite plausible agent log",async()=>{
 const repository=createSyntheticErpEvidenceRepository(seeded.map((x,i)=>i===4?{...x,actorId:"other-worker"}:x));
 const r=await verify(repository);
 assert.equal(r.result.status,"blocked");
 assert.ok(r.result.issues.some(x=>x.code==="RECEIPT_MISMATCH"));
});
test("mutating original fixture after creation cannot change evidence",async()=>{
 const source=seeded.map(x=>({...x}));
 const repository=createSyntheticErpEvidenceRepository(source);
 source[0].status="rejected";
 const result=await verify(repository);
 assert.equal(result.result.matched,7);
});
test("returned read-only copies do not allow modifying stored evidence",async()=>{
 const repository=createSyntheticErpEvidenceRepository(seeded);
 const scope={...expectedScope,runId:events[0].runId};
 const records=await repository.findEvidence(scope,events.map(x=>x.evidenceRef));
 records[0].status="rejected";
 const again=await verify(repository);
 assert.equal(again.result.matched,7);
});
test("invalid synthetic data and untrusted query filters fail closed",async()=>{
 assert.throws(()=>createSyntheticErpEvidenceRepository([{...seeded[0],documentBody:"client details"}]));
 const repository=createSyntheticErpEvidenceRepository(seeded);
 await assert.rejects(repository.findEvidence({...expectedScope,runId:"RUN-ERP-TEST"},["confidential text"]));
});
