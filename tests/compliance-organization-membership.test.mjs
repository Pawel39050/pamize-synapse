import test from "node:test";
import assert from "node:assert/strict";
import {resolveOrganizationMemberships,denyAllMembershipDirectory} from "../src/lib/compliance/organization-membership.ts";
const identity={issuer:"entra-id-verified",subject:"user-a",tenantId:"tenant-a",roles:["author"],organizationIds:[]};
const member=(overrides={})=>({tenantId:"tenant-a",subject:"user-a",organizationId:"org-a",status:"active",roles:["author"],...overrides});
const directory=(records)=>({async findForSubject(){return records;}});
test("default directory grants no organization access",async()=>{
 const result=await resolveOrganizationMemberships({identity,directory:denyAllMembershipDirectory});
 assert.deepEqual(result.organizationIds,[]);
});
test("accepts only active matching membership and deduplicates organization",async()=>{
 const result=await resolveOrganizationMemberships({identity,directory:directory([
 member(),member(),member({organizationId:"org-b",status:"revoked"}),
 member({organizationId:"org-c",roles:["reviewer"]})
 ])});
 assert.deepEqual(result.organizationIds,["org-a"]);
});
test("rejects cross-tenant or cross-subject directory corruption",async()=>{
 await assert.rejects(resolveOrganizationMemberships({identity,directory:directory([member({tenantId:"other"})])}),/Cross-identity/);
 await assert.rejects(resolveOrganizationMemberships({identity,directory:directory([member({subject:"other"})])}),/Cross-identity/);
});
test("rejects client pre-populated memberships",async()=>{
 await assert.rejects(resolveOrganizationMemberships({identity:{...identity,organizationIds:["org-a"]},directory:directory([member()])}),/Untrusted/);
});
