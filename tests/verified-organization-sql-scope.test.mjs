import test from "node:test";
import assert from "node:assert/strict";
import {withVerifiedOrganizationScope} from "../src/lib/compliance/verified-organization-sql-scope.ts";
const identity={issuer:"entra-id-verified",subject:"user-a",tenantId:"tenant-a",roles:["author"],organizationIds:[]};
const membership={tenantId:"tenant-a",subject:"user-a",organizationId:"org-a",status:"active",roles:["author"]};
function harness(records=[membership],roleName="compliance_runtime_login_preview"){
 const calls=[];let connected=0,released=0;
 return {calls,get connected(){return connected},get released(){return released},
  directory:{async findForSubject(){return records}},
  provider:{async connect(){connected++;return {
   async query(sql,params){calls.push({sql,params});
    if(sql.startsWith("SELECT r.rolname"))return {rows:[{rolname:roleName,rolsuper:false,rolbypassrls:false,rolcreatedb:false,rolcreaterole:false,neon_superuser_member:false}],rowCount:1};
    return {rows:[],rowCount:1}},
   release(){released++}
  }}}};
}
test("verified organization context is confined to one transaction",async()=>{
 const h=harness();
 const value=await withVerifiedOrganizationScope({...h,identity,organizationId:"org-a",work:async db=>{
  await db.query("SELECT 1",[]);return 7;
 }});
 assert.equal(value,7);assert.equal(h.calls[0].sql,"BEGIN");
 assert.equal(h.calls.at(-1).sql,"COMMIT");
 assert.deepEqual(h.calls.filter(c=>c.sql.startsWith("SELECT set_config")).map(c=>c.params[0]),["tenant-a","org-a","user-a"]);
 assert.equal(h.released,1);
});
test("cross-org access never opens database connection",async()=>{
 const h=harness();
 await assert.rejects(withVerifiedOrganizationScope({...h,identity,organizationId:"org-b",work:async()=>null}),/forbidden/);
 assert.equal(h.connected,0);
});
test("suspended membership does not open database connection",async()=>{
 const h=harness([{...membership,status:"suspended"}]);
 await assert.rejects(withVerifiedOrganizationScope({...h,identity,organizationId:"org-a",work:async()=>null}),/forbidden/);
 assert.equal(h.connected,0);
});
test("failed scoped query rolls back and releases connection",async()=>{
 const h=harness();
 await assert.rejects(withVerifiedOrganizationScope({...h,identity,organizationId:"org-a",work:async()=>{
  throw Error("unexpected query error");
 }}),/unexpected query error/);
 assert.equal(h.calls.at(-1).sql,"ROLLBACK");
 assert.equal(h.released,1);
});

test("rejects administrative Neon role before setting tenant context",async()=>{
 const h=harness([membership],"neondb_owner");
 await assert.rejects(withVerifiedOrganizationScope({...h,identity,organizationId:"org-a",work:async()=>null}),/Unsafe database runtime identity/);
 assert.equal(h.calls.some(x=>x.sql.startsWith("SELECT set_config")),false);
 assert.equal(h.calls.at(-1).sql,"ROLLBACK");
});
