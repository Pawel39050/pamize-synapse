import test from "node:test";
import assert from "node:assert/strict";
import {assessRegulatoryObligations} from "../src/lib/compliance/regulatory-obligation-engine.ts";
import {buildComplianceDashboardModel} from "../src/lib/compliance/compliance-dashboard-model.ts";

test("GDPR diagnostic feeds consistent worklist and executive KPIs",()=>{
 const findings=assessRegulatoryObligations({
  organizationId:"DEMO",domain:"GDPR",
  applicability:{"gdpr-art-32":"yes","gdpr-art-30":"unknown","gdpr-art-33":"no"},
  evidence:{"gdpr-art-32":[]}
 });
 const initial=buildComplianceDashboardModel({findings,assignments:{},referenceDate:"2026-11-02"});
 assert.equal(initial.taskCount,3);
 assert.equal(initial.highPriorityCount,1);
 assert.equal(initial.possibleEvidenceGapCount,1);
 assert.equal(initial.unknownApplicabilityCount,1);
 assert.equal(initial.unassignedCount,3);
 assert.equal(initial.legalViolationEstablished,false);
 assert.ok(initial.actions.every(a=>a.state==="proposed"));
 const assigned=buildComplianceDashboardModel({findings,assignments:{"gdpr-art-32":{ownerId:"test-owner",dueDate:"2026-10-31"}},referenceDate:"2026-11-02"});
 assert.equal(assigned.assignedCount,1);
 assert.equal(assigned.unassignedCount,2);
 assert.equal(assigned.overdueCount,1);
});
test("AI Act model does not report legal violations without human judgment",()=>{
 const findings=assessRegulatoryObligations({organizationId:"DEMO",domain:"AI_ACT",applicability:{},evidence:{}});
 const model=buildComplianceDashboardModel({findings,assignments:{},referenceDate:""});
 assert.equal(model.taskCount,2);
 assert.equal(model.overdueCount,null);
 assert.equal(model.dataScope,"local-unsaved-demo");
 assert.equal(model.legalViolationEstablished,false);
});

test("joint executive dashboard includes GDPR and AI Act without duplicating tasks",()=>{
 const findings=[
  ...assessRegulatoryObligations({organizationId:"DEMO",domain:"GDPR",applicability:{},evidence:{}}),
  ...assessRegulatoryObligations({organizationId:"DEMO",domain:"AI_ACT",applicability:{},evidence:{}})
 ];
 const model=buildComplianceDashboardModel({findings,assignments:{},referenceDate:"2026-11-02"});
 assert.equal(model.taskCount,5);
 assert.equal(model.unknownApplicabilityCount,5);
 assert.equal(model.unassignedCount,5);
 assert.equal(new Set(model.actions.map(a=>a.obligationId)).size,5);
 assert.ok(model.actions.every(a=>a.state==="proposed"));
});
