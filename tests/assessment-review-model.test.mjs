import test from "node:test";import assert from "node:assert/strict";
import {createAssessmentDraft,transitionAssessment} from "../src/lib/compliance/assessment-review-model.ts";
const input={tenantId:"tenant_one",organizationId:"company_one",createdBy:"author_one",payload:{findings:[]}};
test("draft has stable hash and initial revision",()=>{const a=createAssessmentDraft(input);assert.equal(a.revision,1);assert.equal(a.state,"draft");assert.match(a.payloadHash,/^[a-f0-9]{64}$/)});
test("revision chain cannot cross tenants",()=>{const a=createAssessmentDraft(input);assert.throws(()=>createAssessmentDraft({...input,tenantId:"tenant_two",previous:a}),/Cross-tenant/)});
test("separate reviewer required before approval",()=>{const a=transitionAssessment(createAssessmentDraft(input),"submitted","author_one");assert.throws(()=>transitionAssessment(a,"approved","author_one"),/Self-approval/);assert.equal(transitionAssessment(a,"approved","reviewer_one").state,"approved")});
test("approved revisions cannot be reopened or mutated",()=>{const a=transitionAssessment(transitionAssessment(createAssessmentDraft(input),"submitted","author_one"),"approved","reviewer_one");assert.throws(()=>transitionAssessment(a,"draft","reviewer_one"),/Invalid review/)});
