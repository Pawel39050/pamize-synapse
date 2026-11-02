import test from "node:test";
import assert from "node:assert/strict";
import {resolveScopedOrganizationPrincipal} from "../src/lib/compliance/scoped-organization-principal.ts";
const identity={issuer:"entra-id-verified",subject:"u",tenantId:"t",roles:["author","reviewer"],organizationIds:[]};
const record=(organizationId,roles)=>({tenantId:"t",subject:"u",organizationId,status:"active",roles});
const directory={async findForSubject(){return [record("org-a",["author"]),record("org-b",["reviewer"])]}};
test("roles are scoped to their own organization",async()=>{
 const a=await resolveScopedOrganizationPrincipal({identity,organizationId:"org-a",directory});
 const b=await resolveScopedOrganizationPrincipal({identity,organizationId:"org-b",directory});
 assert.deepEqual(a.roles,["author"]);assert.deepEqual(b.roles,["reviewer"]);
 assert.deepEqual(a.organizationIds,["org-a"]);assert.deepEqual(b.organizationIds,["org-b"]);
});
test("cannot use role assigned in a different organization",async()=>{
 await assert.rejects(resolveScopedOrganizationPrincipal({identity,organizationId:"org-c",directory}),/forbidden/);
});
test("revoked or suspended roles never authorize",async()=>{
 for(const status of ["revoked","suspended"]){
  await assert.rejects(resolveScopedOrganizationPrincipal({identity,organizationId:"org-a",
   directory:{async findForSubject(){return [{...record("org-a",["author"]),status}]}}}),/forbidden/);
 }
});
test("untrusted pre-populated scope and cross-tenant records are denied",async()=>{
 await assert.rejects(resolveScopedOrganizationPrincipal({identity:{...identity,organizationIds:["org-a"]},organizationId:"org-a",directory}),/Untrusted/);
 await assert.rejects(resolveScopedOrganizationPrincipal({identity,organizationId:"org-a",
  directory:{async findForSubject(){return [{...record("org-a",["author"]),tenantId:"other"}]}}}),/Cross-identity/);
});
