import "server-only";
import {createHmac,timingSafeEqual} from "node:crypto";
import {parseLocalProcurementEvents,type LocalEventReview} from "./procurement-event-local-import.ts";

/** Server-side transport verifier, deliberately NOT an API route.
 * This verifies sender-key possession, payload integrity, verified-context
 * tenant scope, freshness, and a caller-provided atomic replay lock.
 * It does not authenticate business evidence references or ERP records.
 */
export type SignedProcurementBatch={
 version:"1";tenantId:string;organizationId:string;agentKey:"AG-PRC-001";
 issuedAt:number;nonce:string;payload:string;mac:string;
};
export type TrustedAgentChannel={
 tenantId:string;organizationId:string;agentKey:"AG-PRC-001";
 secret:Uint8Array;allowed:boolean;
};
export type ReplayRegistry={
 /** Must atomically reserve unique scope + nonce; return false if replayed. */
 reserveOnce:(scope:string,nonce:string,expiresAt:number)=>Promise<boolean>;
};
export type VerifiedTransportReview={
 transportedByAuthenticatedAgent:true;
 verifiedBusinessEvidence:false;
 tenantId:string;organizationId:string;agentKey:"AG-PRC-001";
 receipt:{nonce:string;issuedAt:number};
 localReview:LocalEventReview;
};
const id=/^[A-Za-z0-9_-]{3,100}$/;
const noncePattern=/^[A-Za-z0-9_-]{20,100}$/;
const MAX_SKEW_MS=5*60*1000;
function material(b:SignedProcurementBatch){
 return JSON.stringify([b.version,b.tenantId,b.organizationId,b.agentKey,b.issuedAt,b.nonce,b.payload]);
}
function mac(b:SignedProcurementBatch,secret:Uint8Array){
 return createHmac("sha256",secret).update("pamize-signed-agent-events:v1\n").update(material(b)).digest();
}
/** Only internal trusted sender code with an assigned key may call this. */
export function signProcurementBatch(unsigned:Omit<SignedProcurementBatch,"mac">,secret:Uint8Array):SignedProcurementBatch{
 if(secret.byteLength<32)throw Error("Invalid channel key");
 return {...unsigned,mac:mac({...unsigned,mac:""},secret).toString("base64url")};
}
export async function verifySignedProcurementBatch(args:{
 envelope:SignedProcurementBatch;
 trusted:TrustedAgentChannel|null;
 replay:ReplayRegistry;
 now?:number;
}):Promise<VerifiedTransportReview>{
 const {envelope:b,trusted,replay}=args;
 const now=args.now??Date.now();
 if(!b||typeof b!=="object"||!trusted||trusted.allowed!==true||
  !id.test(trusted.tenantId)||!id.test(trusted.organizationId)||
  trusted.agentKey!=="AG-PRC-001"||trusted.secret.byteLength<32||
  !Number.isSafeInteger(now))throw Error("Untrusted agent channel");
 const keys=Object.keys(b).sort().join(",");
 if(keys!==["version","tenantId","organizationId","agentKey","issuedAt","nonce","payload","mac"].sort().join(","))
  throw Error("Invalid signed envelope");
 if(b.version!=="1"||b.agentKey!=="AG-PRC-001"||
  b.tenantId!==trusted.tenantId||b.organizationId!==trusted.organizationId||
  !id.test(b.tenantId)||!id.test(b.organizationId)||
  !Number.isSafeInteger(b.issuedAt)||Math.abs(now-b.issuedAt)>MAX_SKEW_MS||
  typeof b.nonce!=="string"||!noncePattern.test(b.nonce)||
  typeof b.payload!=="string"||b.payload.length>32_768||
  typeof b.mac!=="string"||!/^[A-Za-z0-9_-]{43}$/.test(b.mac))
  throw Error("Signed batch metadata invalid");
 const supplied=Buffer.from(b.mac,"base64url"),expected=mac(b,trusted.secret);
 if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))
  throw Error("Invalid batch signature");
 // Strict parsing of event metadata; no arbitrary fields, customer data or document bodies.
 const localReview=parseLocalProcurementEvents(b.payload);
 const scope=[b.tenantId,b.organizationId,b.agentKey].join(":");
 if(!await replay.reserveOnce(scope,b.nonce,b.issuedAt+MAX_SKEW_MS))
  throw Error("Event batch replay rejected");
 return {transportedByAuthenticatedAgent:true,verifiedBusinessEvidence:false,
  tenantId:trusted.tenantId,organizationId:trusted.organizationId,agentKey:trusted.agentKey,
  receipt:{nonce:b.nonce,issuedAt:b.issuedAt},localReview};
}
