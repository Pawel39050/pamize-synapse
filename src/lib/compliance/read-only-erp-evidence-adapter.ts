import {reconcileIndependentSourceEvidence,type SourceReceipt,type SourceEvidenceResult} from "./independent-procurement-evidence.ts";
import type {ProcurementEvent,EventAuditResult} from "./procurement-event-audit.ts";

/**
 * Contract for a future READ-ONLY, separately authenticated ERP integration.
 * No remote requests, database connection, credentials or public API are created here.
 * A trusted server-side composition root must supply the binding and repository.
 * Never construct the binding from client input or from a submitted agent log.
 */
export type TrustedErpBinding={
 tenantId:string;
 organizationId:string;
 sourceSystemId:string;
 permission:"evidence:read";
 authenticatedBy:"erp-adapter-server";
};
export type EvidenceReadScope={tenantId:string;organizationId:string;sourceSystemId:string;runId:string};
export type EvidenceReadOnlyRepository={
 findEvidence:(scope:EvidenceReadScope,evidenceRefs:readonly string[])=>Promise<readonly SourceReceipt[]>;
};
export type IndependentErpAudit={
 source:"read-only-erp-adapter-contract";
 organizationId:string;
 result:SourceEvidenceResult;
};
const identifier=/^[A-Za-z0-9_-]{3,80}$/;
const evidenceRef=/^[A-Za-z0-9_:/.-]{3,120}$/;
export async function auditWithIndependentErpAdapter(input:{
 binding:TrustedErpBinding|null;
 expectedScope:{tenantId:string;organizationId:string;sourceSystemId:string};
 repository:EvidenceReadOnlyRepository;
 events:readonly ProcurementEvent[];
 audit:EventAuditResult;
}):Promise<IndependentErpAudit>{
 const {binding,expectedScope,repository,events,audit}=input;
 if(!binding||binding.authenticatedBy!=="erp-adapter-server"||
  binding.permission!=="evidence:read"||
  !identifier.test(binding.tenantId)||!identifier.test(binding.organizationId)||
  !identifier.test(binding.sourceSystemId)||
  binding.tenantId!==expectedScope.tenantId||
  binding.organizationId!==expectedScope.organizationId||
  binding.sourceSystemId!==expectedScope.sourceSystemId||
  !repository||typeof repository.findEvidence!=="function")
  throw Error("Independent ERP adapter identity not verified");
 if(!Array.isArray(events)||events.length===0||events.length>100||
  !identifier.test(audit.runId)||events.some(e=>e.runId!==audit.runId||
   (e.evidenceRef!==null&&!evidenceRef.test(e.evidenceRef))))
  throw Error("Invalid event scope for ERP verification");
 const refs=[...new Set(events.map(e=>e.evidenceRef).filter((v):v is string=>Boolean(v)))];
 const scope:EvidenceReadScope={tenantId:binding.tenantId,organizationId:binding.organizationId,
  sourceSystemId:binding.sourceSystemId,runId:audit.runId};
 const receipts=await repository.findEvidence(scope,refs);
 if(!Array.isArray(receipts)||receipts.length>100)throw Error("Invalid ERP evidence response");
 // Never downgrade a read failure or missing evidence into source authentication success.
 for(const receipt of receipts){
  if(receipt.runId!==scope.runId||receipt.sourceSystemId!==scope.sourceSystemId||
   !refs.includes(receipt.evidenceRef)){
   throw Error("ERP returned out-of-scope evidence");
  }
 }
 const result=reconcileIndependentSourceEvidence({
  events,receipts,trustedSourceSystemId:scope.sourceSystemId,
  sourceAuthenticated:true,audit
 });
 return {source:"read-only-erp-adapter-contract",organizationId:scope.organizationId,result};
}
