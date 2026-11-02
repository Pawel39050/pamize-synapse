import test from "node:test";
import assert from "node:assert/strict";
import {assessRegulatoryObligations} from "../src/lib/compliance/regulatory-obligation-engine.ts";
import {planRegulatoryImpact} from "../src/lib/compliance/regulatory-impact-planner.ts";
test("process-specific potential gap becomes a triage action requiring approval",()=>{
 const findings=assessRegulatoryObligations({organizationId:"pilot",domain:"GDPR",applicability:{"gdpr-art-32":"yes"},evidence:{}});
 const plan=planRegulatoryImpact(findings,[{processId:"proc-1",processName:"Customer service",ownerId:null,obligationIds:["gdpr-art-32","gdpr-art-32"]}]);
 assert.equal(plan.length,1);assert.equal(plan[0].priority,"triage");assert.equal(plan[0].approvalRequired,true);
});
test("non-matching obligations do not create actions",()=>{
 assert.deepEqual(planRegulatoryImpact([], [{processId:"x",processName:"Finance",ownerId:null,obligationIds:["unknown"]}]),[]);
});
