import test from "node:test";
import assert from "node:assert/strict";
import {assessRegulatoryObligations} from "../src/lib/compliance/regulatory-obligation-engine.ts";
test("unknown applicability never becomes a compliance conclusion",()=>{
 const findings=assessRegulatoryObligations({organizationId:"demo",domain:"GDPR",applicability:{},evidence:{}});
 assert.equal(findings.length,3);
 assert.ok(findings.every(f=>f.status==="requires-evidence"&&f.humanApprovalRequired));
});
test("missing GDPR evidence gives potential gap, not finding of infringement",()=>{
 const findings=assessRegulatoryObligations({organizationId:"demo",domain:"GDPR",applicability:{"gdpr-art-32":"yes"},evidence:{}});
 assert.equal(findings.find(f=>f.obligationId==="gdpr-art-32")?.status,"potential-gap");
});
test("supplied evidence does not automatically certify compliance",()=>{
 const findings=assessRegulatoryObligations({organizationId:"demo",domain:"AI_ACT",applicability:{"ai-act-art-4":"yes"},evidence:{"ai-act-art-4":["ai-literacy-measures"]}});
 assert.equal(findings.find(f=>f.obligationId==="ai-act-art-4")?.status,"review-required");
});
test("domains isolated and no conclusions about inapplicability without review",()=>{
 const findings=assessRegulatoryObligations({organizationId:"demo",domain:"AI_ACT",applicability:{"ai-act-art-9":"no"},evidence:{}});
 assert.equal(findings.length,2);
 assert.equal(findings.find(f=>f.obligationId==="ai-act-art-9")?.status,"review-required");
});
test("empty organization is rejected",()=>{
 assert.throws(()=>assessRegulatoryObligations({organizationId:" ",domain:"GDPR",applicability:{},evidence:{}}));
});
