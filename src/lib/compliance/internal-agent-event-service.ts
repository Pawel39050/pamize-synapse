import {verifySignedProcurementBatch,type SignedProcurementBatch,type TrustedAgentChannel,type VerifiedTransportReview} from "./signed-agent-event-channel.ts";
import {makeRestrictedReplayRegistry,type RestrictedReplayExecutor} from "./restricted-replay-registry.ts";

/**
 * Internal service composition only: no API route, no credentials embedded, no database
 * connection established. Trusted configuration MUST be resolved server-side from a
 * verified registry; never from unsigned request headers or envelope identifiers.
 */
export type AgentCredentialRecord={
 tenantId:string;organizationId:string;agentKey:"AG-PRC-001";
 keyId:string;status:"active"|"disabled";validFrom:number;validUntil:number;
 secret:Uint8Array;
};
export type CredentialLookup={
 resolve:(identity:{tenantId:string;organizationId:string;agentKey:"AG-PRC-001";keyId:string})=>Promise<AgentCredentialRecord|null>;
};
export type SignedAgentEventRequest={
 keyId:string;envelope:SignedProcurementBatch;
};
const keyIdPattern=/^[A-Za-z0-9_-]{3,80}$/;
export async function checkInternalAgentEventRequest(input:{
 request:SignedAgentEventRequest;
 lookup:CredentialLookup;
 replayExecutor:RestrictedReplayExecutor;
 verifiedExpectedScope:{tenantId:string;organizationId:string;agentKey:"AG-PRC-001"};
 now?:number;
}):Promise<VerifiedTransportReview>{
 const {request,lookup,replayExecutor,verifiedExpectedScope:scope}=input;
 const now=input.now??Date.now();
 if(!request||!request.envelope||!keyIdPattern.test(request.keyId)||!lookup||
  typeof lookup.resolve!=="function"||!replayExecutor||
  !scope||scope.agentKey!=="AG-PRC-001"||!scope.tenantId||!scope.organizationId||
  !Number.isSafeInteger(now))throw Error("Channel unavailable");
 const b=request.envelope;
 if(b.tenantId!==scope.tenantId||b.organizationId!==scope.organizationId||b.agentKey!==scope.agentKey)
  throw Error("Agent scope mismatch");
 const record=await lookup.resolve({...scope,keyId:request.keyId});
 if(!record||record.status!=="active"||record.keyId!==request.keyId||
  record.tenantId!==scope.tenantId||record.organizationId!==scope.organizationId||
  record.agentKey!==scope.agentKey||!Number.isSafeInteger(record.validFrom)||
  !Number.isSafeInteger(record.validUntil)||record.validUntil<=record.validFrom||
  now<record.validFrom||now>=record.validUntil||record.secret.byteLength<32)
  throw Error("Agent credential denied");
 const trusted:TrustedAgentChannel={
  tenantId:record.tenantId,organizationId:record.organizationId,
  agentKey:record.agentKey,secret:record.secret,allowed:true
 };
 return verifySignedProcurementBatch({
  envelope:b,trusted,replay:makeRestrictedReplayRegistry(replayExecutor),now
 });
}
