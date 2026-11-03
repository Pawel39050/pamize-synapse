import test from "node:test";
import assert from "node:assert/strict";
import {screenAiActRisk} from "../src/lib/compliance/ai-act-risk-screening.ts";
const defaults={prohibitedPractice:"unknown",annexIIIContext:"unknown",safetyComponent:"unknown",directlyInteractsWithPeople:"unknown"};
test("unknown answers never produce risk clearance",()=>{
 const r=screenAiActRisk(defaults);
 assert.equal(r.status,"classification-incomplete");assert.equal(r.reviewRequired,true);
});
test("possible prohibited practice is escalated",()=>{
 const r=screenAiActRisk({...defaults,prohibitedPractice:"yes"});
 assert.equal(r.status,"priority-legal-review");assert.ok(r.references.includes("Art. 5"));
});
test("employment Annex III signals high risk review, not automatic classification",()=>{
 const r=screenAiActRisk({...defaults,prohibitedPractice:"no",annexIIIContext:"yes"});
 assert.equal(r.status,"high-risk-screening");assert.equal(r.reviewRequired,true);
});
test("safety-component signal needs full high-risk analysis",()=>{
 const r=screenAiActRisk({...defaults,prohibitedPractice:"no",safetyComponent:"yes"});
 assert.equal(r.status,"high-risk-screening");
});
test("direct human interaction triggers transparency review",()=>{
 const r=screenAiActRisk({prohibitedPractice:"no",annexIIIContext:"no",safetyComponent:"no",directlyInteractsWithPeople:"yes"});
 assert.equal(r.status,"transparency-review");assert.ok(r.references.includes("Art. 50"));
});
test("negative screening does not certify minimal risk",()=>{
 const r=screenAiActRisk({prohibitedPractice:"no",annexIIIContext:"no",safetyComponent:"no",directlyInteractsWithPeople:"no"});
 assert.equal(r.status,"classification-incomplete");assert.equal(r.reviewRequired,true);
});
test("invalid input rejected",()=>{
 assert.throws(()=>screenAiActRisk({...defaults,prohibitedPractice:"approved"}));
});
