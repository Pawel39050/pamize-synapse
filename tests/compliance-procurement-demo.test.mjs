import test from "node:test";
import assert from "node:assert/strict";
import {initialAgents} from "../src/lib/catalog.ts";
import {screenAiActRisk} from "../src/lib/compliance/ai-act-risk-screening.ts";
import {assessRegulatoryObligations} from "../src/lib/compliance/regulatory-obligation-engine.ts";
import {planRegulatoryImpact} from "../src/lib/compliance/regulatory-impact-planner.ts";
test("procurement digital worker is a planned demo definition with human approval",()=>{
 const agent=initialAgents.find(a=>a.key==="AG-PRC-001");
 assert.ok(agent);
 assert.equal(agent.lifecycle,"planned");
 assert.ok(agent.skillKeys.includes("human-approval"));
 assert.deepEqual(agent.toolKeys,[]);
});
test("procurement scenario: transparency review does not certify low risk",()=>{
 const result=screenAiActRisk({prohibitedPractice:"no",annexIIIContext:"no",safetyComponent:"no",directlyInteractsWithPeople:"yes"});
 assert.equal(result.status,"transparency-review");
 assert.equal(result.reviewRequired,true);
});
test("procurement scenario: unclear applicability remains unresolved",()=>{
 const result=screenAiActRisk({prohibitedPractice:"unknown",annexIIIContext:"unknown",safetyComponent:"unknown",directlyInteractsWithPeople:"yes"});
 assert.equal(result.status,"classification-incomplete");
});
test("procurement scenario: missing GDPR evidence yields review actions",()=>{
 const findings=assessRegulatoryObligations({organizationId:"LOCAL-UNSAVED-ASSESSMENT",domain:"GDPR",
  applicability:{"gdpr-art-32":"yes"},evidence:{}});
 assert.equal(findings.find(f=>f.obligationId==="gdpr-art-32")?.status,"potential-gap");
 const actions=planRegulatoryImpact(findings,[{processId:"procurement-demo",processName:"Supplier offer analysis",obligationIds:["gdpr-art-32"],ownerId:null}]);
 assert.equal(actions.length,1);
 assert.equal(actions[0].approvalRequired,true);
 assert.equal(actions[0].priority,"triage");
});
