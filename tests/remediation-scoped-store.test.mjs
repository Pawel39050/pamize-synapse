import test from "node:test";
import assert from "node:assert/strict";
import {readScopedRemediation,runScopedRemediation} from "../src/lib/compliance/remediation-scoped-store.ts";
const principal={issuer:"entra-id-verified",subject:"author-123",tenantId:"tenant-123",roles:["author"],organizationIds:["org-123"]};
const record={id:"item-123",obligationId:"gdpr-art-32",description:"Check evidence",priority:"high",state:"proposed",ownerId:null,dueDate:null,reviewerId:null,approvedAt:null,sourceUrl:"https://eur-lex.europa.eu/"};
const ledger={tenantId:"tenant-123",organizationId:"org-123",actions:[record],events:[]};
const scope={tenantId:"tenant-123",organizationId:"org-123"};
test("rejects unauthorized access before touching repository",async()=>{
 let accessed=false;
 const store={load:async()=>{accessed=true;return {ledger,revision:1}},commit:async()=>true};
 await assert.rejects(readScopedRemediation({store,principal:{...principal,organizationIds:[]},scope}),/Forbidden/);
 assert.equal(accessed,false);
});
test("rejects data returned for another organization",async()=>{
 const store={load:async()=>({ledger:{...ledger,organizationId:"org-other"},revision:1}),commit:async()=>true};
 await assert.rejects(readScopedRemediation({store,principal,scope}),/scoped repository/);
});
test("rejects concurrent writes without silently overwriting",async()=>{
 const store={load:async()=>({ledger,revision:5}),commit:async()=>false};
 await assert.rejects(runScopedRemediation({store,principal,scope,
  command:{kind:"assign",actionId:"item-123",expectedState:"proposed",ownerId:"author-123",dueDate:"2026-12-01"},
  at:"2026-11-02T10:00:00Z"}),/Concurrent revision conflict/);
});
