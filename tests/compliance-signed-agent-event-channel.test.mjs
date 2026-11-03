import test from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {signProcurementBatch,verifySignedProcurementBatch} from "../src/lib/compliance/signed-agent-event-channel.ts";
import {PROCUREMENT_EVENT_SCENARIOS} from "../src/lib/compliance/procurement-event-audit.ts";
const now=Date.parse("2026-11-03T10:20:00.000Z");
const make=()=>{
 const secret=randomBytes(32);
 const trusted={tenantId:"tenant-test-a",organizationId:"organization-test-a",agentKey:"AG-PRC-001",secret,allowed:true};
 const payload=JSON.stringify({schemaVersion:"1",agentKey:"AG-PRC-001",events:PROCUREMENT_EVENT_SCENARIOS[0].events});
 const unsigned={version:"1",tenantId:trusted.tenantId,organizationId:trusted.organizationId,agentKey:"AG-PRC-001",issuedAt:now,nonce:randomBytes(24).toString("base64url"),payload};
 const envelope=signProcurementBatch(unsigned,secret);
 const seen=new Set();
 const replay={reserveOnce:async(scope,nonce)=>{const key=scope+":"+nonce;if(seen.has(key))return false;seen.add(key);return true}};
 return {trusted,envelope,replay};
};
test("signed demo events accepted but business evidence explicitly unverified",async()=>{
 const data=make();const result=await verifySignedProcurementBatch({...data,now});
 assert.equal(result.transportedByAuthenticatedAgent,true);
 assert.equal(result.verifiedBusinessEvidence,false);
 assert.equal(result.localReview.audit.verifiedSource,false);
 assert.equal(result.localReview.audit.status,"review-required");
});
test("tampered payload and scope blocked",async()=>{
 const data=make();
 await assert.rejects(verifySignedProcurementBatch({...data,envelope:{...data.envelope,payload:data.envelope.payload+" "},now}));
 await assert.rejects(verifySignedProcurementBatch({...data,envelope:{...data.envelope,organizationId:"organization-test-b"},now}));
 await assert.rejects(verifySignedProcurementBatch({...data,trusted:{...data.trusted,organizationId:"organization-test-b"},now}));
});
test("disabled channel and wrong secret rejected",async()=>{
 const data=make();
 await assert.rejects(verifySignedProcurementBatch({...data,trusted:{...data.trusted,allowed:false},now}));
 await assert.rejects(verifySignedProcurementBatch({...data,trusted:{...data.trusted,secret:randomBytes(32)},now}));
});
test("replay rejected by atomic registry",async()=>{
 const data=make();await verifySignedProcurementBatch({...data,now});
 await assert.rejects(verifySignedProcurementBatch({...data,now}));
});
test("expired and future batches rejected",async()=>{
 const data=make();
 await assert.rejects(verifySignedProcurementBatch({...data,now:now+5*60*1000+1}));
 await assert.rejects(verifySignedProcurementBatch({...data,now:now-5*60*1000-1}));
});
test("malformed signatures and extra fields fail closed",async()=>{
 const data=make();
 await assert.rejects(verifySignedProcurementBatch({...data,envelope:{...data.envelope,mac:"broken"},now}));
 await assert.rejects(verifySignedProcurementBatch({...data,envelope:{...data.envelope,override:true},now}));
});
test("invalid event payload rejected after authentic signature",async()=>{
 const data=make();const wrong=signProcurementBatch({...data.envelope,payload:JSON.stringify({schemaVersion:"1",agentKey:"AG-PRC-001",events:[{evil:true}]}),mac:undefined},data.trusted.secret);
 await assert.rejects(verifySignedProcurementBatch({...data,envelope:wrong,now}));
});
test("reject short signing key",()=>{
 const data=make();assert.throws(()=>signProcurementBatch(data.envelope,randomBytes(12)));
});
