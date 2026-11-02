import test from "node:test";import assert from "node:assert/strict";
import {buildComplianceReviewQueue} from "../src/lib/compliance/compliance-review-queue.ts";
const base={sourceUrl:"https://eur-lex.europa.eu/eli/reg/2016/679/oj",article:"Art. 32",requirement:"Security",missingEvidence:[],reason:"Needs review",humanApprovalRequired:true};
test("prioritizes evidence gap before applicability unknown and reviewed material",()=>{
 const tasks=buildComplianceReviewQueue([
  {...base,obligationId:"a",status:"review-required"},
  {...base,obligationId:"b",status:"requires-evidence"},
  {...base,obligationId:"c",status:"potential-gap"}]);
 assert.deepEqual(tasks.map(t=>t.obligationId),["c","b","a"]);
 assert.ok(tasks.every(t=>t.humanApprovalRequired&&!t.legalViolationEstablished));
 assert.deepEqual(tasks.map(t=>t.taskType),["collect-evidence","verify-applicability","substantive-review"]);
});
test("rejects duplicate obligation IDs",()=>{
 assert.throws(()=>buildComplianceReviewQueue([{...base,obligationId:"a",status:"potential-gap"},{...base,obligationId:"a",status:"review-required"}]));
});
