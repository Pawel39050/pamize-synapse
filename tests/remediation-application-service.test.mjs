import test from "node:test";
import assert from "node:assert/strict";
import {executeRemediationCommand,readAuthorizedRemediation} from "../src/lib/compliance/remediation-application-service.ts";
const author={issuer:"entra-id-verified",subject:"author-123",tenantId:"tenant-123",roles:["author"],organizationIds:["org-123"]};
const reviewer={...author,subject:"reviewer-123",roles:["reviewer"]};
const action={id:"action-123",obligationId:"gdpr-art-32",description:"Check",priority:"high",state:"proposed",ownerId:null,dueDate:null,reviewerId:null,approvedAt:null,sourceUrl:"https://eur-lex.europa.eu/"};
const empty=()=>({tenantId:"tenant-123",organizationId:"org-123",actions:[action],events:[]});
test("full remediation cycle with independent review",()=>{
 let ledger=executeRemediationCommand({ledger:empty(),principal:author,command:{kind:"assign",actionId:"action-123",expectedState:"proposed",ownerId:"author-123",dueDate:"2026-12-01"},at:"2026-11-02T10:00:00Z"});
 ledger=executeRemediationCommand({ledger,principal:author,command:{kind:"progress",actionId:"action-123",expectedState:"assigned",to:"in-progress"},at:"2026-11-02T10:05:00Z"});
 ledger=executeRemediationCommand({ledger,principal:author,command:{kind:"progress",actionId:"action-123",expectedState:"in-progress",to:"awaiting-review"},at:"2026-11-02T10:10:00Z"});
 assert.throws(()=>executeRemediationCommand({ledger,principal:author,command:{kind:"review",actionId:"action-123",expectedState:"awaiting-review",to:"approved"},at:"2026-11-02T10:20:00Z"}));
 ledger=executeRemediationCommand({ledger,principal:reviewer,command:{kind:"review",actionId:"action-123",expectedState:"awaiting-review",to:"approved"},at:"2026-11-02T10:20:00Z"});
 assert.equal(ledger.actions[0].state,"approved");assert.equal(ledger.events.length,4);
});
test("cross-organization read and stale revision denied",()=>{
 assert.throws(()=>readAuthorizedRemediation({ledger:empty(),principal:{...author,organizationIds:["different-org"]}}));
 const ledger=executeRemediationCommand({ledger:empty(),principal:author,command:{kind:"assign",actionId:"action-123",expectedState:"proposed",ownerId:"author-123",dueDate:"2026-12-01"},at:"2026-11-02T10:00:00Z"});
 assert.throws(()=>executeRemediationCommand({ledger,principal:author,command:{kind:"assign",actionId:"action-123",expectedState:"proposed",ownerId:"author-123",dueDate:"2026-12-01"},at:"2026-11-02T10:00:00Z"}));
});
