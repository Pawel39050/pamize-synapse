import test from "node:test";
import assert from "node:assert/strict";
import {makePgErpSessionProvider,validateErpPreviewConnectionString} from "../src/lib/compliance/pg-erp-readonly-session-provider.ts";
import {makeSessionBoundErpRepository} from "../src/lib/compliance/session-bound-erp-repository.ts";
const role="compliance_erp_reader_preview";
const identity={currentUser:role,sessionUser:role,sessionCanLogin:true,
 sessionBypassRls:false,sessionSuperuser:false,sessionCreateRole:false,
 sessionCreateDb:false,activeBypassRls:false,rlsEnabled:true,rlsForced:true,
 canRead:true,canInsert:false,canUpdate:false,canDelete:false};
const scope={tenantId:"tenant-test-a",organizationId:"org-test-a",
 sourceSystemId:"ERP-DEMO-001",runId:"RUN-DEMO-ERP"};
const receipt={eventId:"event-1",runId:scope.runId,kind:"request-created",
 actorId:"requester-demo",evidenceRef:"synthetic-request-created",
 sourceSystemId:scope.sourceSystemId,status:"confirmed",sourceRecordId:"erp-evidence-a-1"};
const fake=(id=identity,failAt="")=>{
 const calls=[];
 const pool={connect:async()=>{
  calls.push("connect");
  return {query:async(sql,params)=>{
   calls.push(sql.startsWith("SELECT")?"SELECT":sql);
   if(failAt==="begin"&&sql.startsWith("BEGIN"))throw Error("begin failed");
   if(failAt==="read"&&sql.includes("FROM public.compliance_synthetic_erp_receipts"))throw Error("read failed");
   if(failAt==="commit"&&sql==="COMMIT")throw Error("commit failed");
   if(sql.includes("FROM pg_roles session"))return {rows:[id]};
   if(sql.includes("FROM public.compliance_synthetic_erp_receipts"))return {rows:[receipt]};
   return {rows:[]};
  },release:()=>calls.push("release")};
 }};
 return {calls,repository:makeSessionBoundErpRepository(makePgErpSessionProvider(pool))};
};
test("one connection: BEGIN READ ONLY, identity, read, COMMIT, release",async()=>{
 const a=fake();
 assert.deepEqual(await a.repository.findEvidence(scope,[receipt.evidenceRef]),[receipt]);
 assert.deepEqual(a.calls,["connect","BEGIN TRANSACTION READ ONLY","SELECT","SELECT","COMMIT","release"]);
});
test("privileged login rolls back; never reads receipts",async()=>{
 const a=fake({...identity,sessionUser:"neondb_owner",sessionBypassRls:true});
 await assert.rejects(a.repository.findEvidence(scope,[receipt.evidenceRef]));
 assert.deepEqual(a.calls,["connect","BEGIN TRANSACTION READ ONLY","SELECT","ROLLBACK","release"]);
});
test("read failures roll back and release client",async()=>{
 const a=fake(identity,"read");
 await assert.rejects(a.repository.findEvidence(scope,[receipt.evidenceRef]));
 assert.equal(a.calls.at(-2),"ROLLBACK");assert.equal(a.calls.at(-1),"release");
});
test("transaction BEGIN failure still releases client",async()=>{
 const a=fake(identity,"begin");
 await assert.rejects(a.repository.findEvidence(scope,[receipt.evidenceRef]));
 assert.deepEqual(a.calls,["connect","BEGIN TRANSACTION READ ONLY","release"]);
});
test("commit errors fail closed and release",async()=>{
 const a=fake(identity,"commit");
 await assert.rejects(a.repository.findEvidence(scope,[receipt.evidenceRef]));
 assert.equal(a.calls.at(-1),"release");
});
test("invalid connection usernames and hosts are blocked",()=>{
 const allowed="postgresql://compliance_erp_reader_preview:example-secret@ep-preview.neon.tech/neondb?sslmode=require";
 assert.doesNotThrow(()=>validateErpPreviewConnectionString(allowed,"ep-preview.neon.tech","ep-prod.neon.tech"));
 for(const bad of [
  allowed.replace("compliance_erp_reader_preview","neondb_owner"),
  allowed.replace("ep-preview.neon.tech","ep-prod.neon.tech"),
  allowed.replace("sslmode=require","sslmode=disable"),
  allowed.replace(":example-secret",""),
  allowed.replace("postgresql:","http:")
 ])assert.throws(()=>validateErpPreviewConnectionString(bad,"ep-preview.neon.tech","ep-prod.neon.tech"));
});
