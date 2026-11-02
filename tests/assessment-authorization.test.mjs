import test from "node:test";
import assert from "node:assert/strict";
import {authorizeAssessmentAction} from "../src/lib/compliance/assessment-authorization.ts";
const principal={issuer:"entra-id-verified",subject:"user_author",tenantId:"tenant_one",roles:["author"],organizationIds:["organization_one"]};
const check=(overrides={})=>authorizeAssessmentAction({principal,recordTenantId:"tenant_one",recordOrganizationId:"organization_one",action:"assessment:create",...overrides});
test("missing or spoofed principal is denied",()=>{assert.equal(check({principal:null}),false);assert.equal(check({principal:{...principal,issuer:"unverified"}}),false)});
test("tenant and organization membership enforced",()=>{assert.equal(check({recordTenantId:"tenant_two"}),false);assert.equal(check({recordOrganizationId:"organization_two"}),false)});
test("author can create but cannot approve",()=>{assert.equal(check(),true);assert.equal(check({action:"assessment:approve",recordCreatedBy:"someone_else"}),false)});
test("reviewer can approve only someone else's assessment",()=>{
 const reviewer={...principal,subject:"user_reviewer",roles:["reviewer"]};
 assert.equal(check({principal:reviewer,action:"assessment:approve",recordCreatedBy:"user_author"}),true);
 assert.equal(check({principal:reviewer,action:"assessment:approve",recordCreatedBy:"user_reviewer"}),false);
});
test("viewer may read but not submit",()=>{
 const viewer={...principal,roles:["viewer"]};
 assert.equal(check({principal:viewer,action:"assessment:read"}),true);
 assert.equal(check({principal:viewer,action:"assessment:submit"}),false);
});
