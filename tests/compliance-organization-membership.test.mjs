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

import {createMembershipDirectory} from "../src/lib/compliance/database-membership-directory.ts";
const dbRow=(change={})=>({tenant_id:"tenant-a",subject_id:"user-a",organization_id:"org-a",status:"active",role:"author",...change});
test("database directory accepts valid membership for signed-in identity",async()=>{
 const d=createMembershipDirectory(async({tenantId,subject})=>{
  assert.equal(tenantId,"tenant-a");assert.equal(subject,"user-a");return [dbRow()];
 });
 const p=await resolveOrganizationMemberships({identity,directory:d});
 assert.deepEqual(p.organizationIds,["org-a"]);
});
test("database directory denies unprovisioned organization",async()=>{
 const p=await resolveOrganizationMemberships({identity,directory:createMembershipDirectory(async()=>[])});
 assert.deepEqual(p.organizationIds,[]);
});
test("database directory rejects cross-identity rows",async()=>{
 for(const record of [dbRow({tenant_id:"tenant-b"}),dbRow({subject_id:"user-b"})]){
  await assert.rejects(resolveOrganizationMemberships({identity,directory:createMembershipDirectory(async()=>[record])}),/Cross-identity/);
 }
});
test("database directory rejects malformed status and role",async()=>{
 for(const record of [dbRow({role:"admin"}),dbRow({status:"pending"}),dbRow({organization_id:""})]){
  await assert.rejects(resolveOrganizationMemberships({identity,directory:createMembershipDirectory(async()=>[record])}));
 }
});
test("database directory rejects excessive membership response",async()=>{
 await assert.rejects(resolveOrganizationMemberships({identity,directory:createMembershipDirectory(async()=>Array.from({length:101},()=>dbRow()))}),/Invalid membership response/);
});
