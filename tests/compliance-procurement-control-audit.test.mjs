import test from "node:test";
import assert from "node:assert/strict";
import {auditProcurementCase,PROCUREMENT_DEMO_CASES} from "../src/lib/compliance/procurement-control-audit.ts";
const byId=id=>PROCUREMENT_DEMO_CASES.find(c=>c.id===id);
test("safe transaction passes illustrative controls without legal clearance",()=>{
 const r=auditProcurementCase(byId("PROC-001"));
 assert.equal(r.findings.length,0);assert.equal(r.reviewRequired,true);assert.equal(r.status,"controls-passed");
});
for(const [id,code] of [["PROC-002","BUDGET_LIMIT"],["PROC-003","MISSING_APPROVAL"],["PROC-004","CONFLICT_OF_INTEREST"],["PROC-005","UNJUSTIFIED_SELECTION"],["PROC-006","MISSING_AUDIT"],["PROC-007","GDPR_REVIEW"]]){
 test(id+" detects "+code,()=>{const r=auditProcurementCase(byId(id));assert.ok(r.findings.some(f=>f.code===code));assert.equal(r.reviewRequired,true)});
}
test("higher price requires justification, not categorical illegality",()=>{
 const r=auditProcurementCase(byId("PROC-005"));assert.equal(r.findings.find(f=>f.code==="UNJUSTIFIED_SELECTION")?.category,"evidence-gap");
});
test("personal data review is not automatic GDPR violation",()=>{
 const r=auditProcurementCase(byId("PROC-007"));assert.equal(r.findings.find(f=>f.code==="GDPR_REVIEW")?.category,"legal-review");
});
test("reject duplicate supplier identifiers and non-finite monetary values",()=>{
 assert.throws(()=>auditProcurementCase({...byId("PROC-001"),offers:[byId("PROC-001").offers[0],byId("PROC-001").offers[0]]}));
 assert.throws(()=>auditProcurementCase({...byId("PROC-001"),requestedAmountPln:Number.NaN}));
});
test("self-approval is not valid segregation of duties",()=>{
 const c=byId("PROC-001");const r=auditProcurementCase({...c,approvedBy:c.requesterId});assert.ok(r.findings.some(f=>f.code==="MISSING_APPROVAL"&&f.haltRecommended));
});
