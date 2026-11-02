import test from "node:test";import assert from "node:assert/strict";
import {createRemediationPlan,assignRemediation,advanceRemediation} from "../src/lib/compliance/remediation-plan.ts";
const task={obligationId:"gdpr-art-32",article:"Art. 32",priority:"high",taskType:"collect-evidence",reason:"Missing",sourceUrl:"https://eur-lex.europa.eu/eli/reg/2016/679/oj",humanApprovalRequired:true,legalViolationEstablished:false};
test("remediation progresses from proposal to independent approval",()=>{
 let a=createRemediationPlan([task])[0];
 a=assignRemediation(a,"owner-1","2026-12-01");
 a=advanceRemediation(a,"in-progress","owner-1","");
 a=advanceRemediation(a,"awaiting-review","owner-1","");
 assert.throws(()=>advanceRemediation(a,"approved","owner-1","2026-11-02T12:00:00Z"),/Self approval/);
 const approved=advanceRemediation(a,"approved","reviewer-2","2026-11-02T12:00:00Z");
 assert.equal(approved.state,"approved");assert.equal(approved.reviewerId,"reviewer-2");
});
test("invalid dates and skipping review forbidden",()=>{
 let a=createRemediationPlan([task])[0];
 assert.throws(()=>assignRemediation(a,"owner-1","2026-02-30"));
 a=assignRemediation(a,"owner-1","2026-12-01");
 assert.throws(()=>advanceRemediation(a,"approved","reviewer-2","2026-11-02T12:00:00Z"));
 assert.throws(()=>advanceRemediation(a,"in-progress","someone-else",""));
});
