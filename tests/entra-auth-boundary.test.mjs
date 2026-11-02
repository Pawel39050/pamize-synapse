import test from "node:test";import assert from "node:assert/strict";
import {authorizeAssessmentAction} from "../src/lib/compliance/assessment-authorization.ts";
// Authorization must remain independent of any user-supplied tenant or organization fields.
test("token authentication alone grants no cross-tenant access",()=>{
 const verified={issuer:"entra-id-verified",subject:"entra_user",tenantId:"tenant_a",roles:["reviewer"],organizationIds:["company_a"]};
 assert.equal(authorizeAssessmentAction({principal:verified,recordTenantId:"tenant_b",recordOrganizationId:"company_a",action:"assessment:read"}),false);
 assert.equal(authorizeAssessmentAction({principal:verified,recordTenantId:"tenant_a",recordOrganizationId:"company_b",action:"assessment:approve",recordCreatedBy:"someone_else"}),false);
});
