import type {EvidenceReadOnlyRepository,EvidenceReadScope} from "./read-only-erp-evidence-adapter.ts";
import type {SourceReceipt} from "./independent-procurement-evidence.ts";

/** Isolated immutable ERP-like test store.
 * Seeded by a separate test fixture (never from an agent's claimed event log
 * during verification). No database, persistence, ERP credentials or writes.
 * Suitable only for offline integration tests; not an authentication mechanism.
 */
export type SyntheticErpEvidenceRecord=SourceReceipt & {
 tenantId:string;
 organizationId:string;
};
const ident=/^[A-Za-z0-9_-]{3,80}$/;
const evidence=/^[A-Za-z0-9_:/.-]{3,120}$/;
export function createSyntheticErpEvidenceRepository(
 seed:readonly SyntheticErpEvidenceRecord[]
):EvidenceReadOnlyRepository{
 if(!Array.isArray(seed)||seed.length>100)throw Error("Invalid test ERP seed");
 const allowedKinds=new Set(["request-created","criteria-approved","rfq-prepared",
  "offers-received","recommendation-issued","human-approved","order-sent"]);
 const records:readonly SyntheticErpEvidenceRecord[]=seed.map(record=>{
  if(!record||Object.keys(record).sort().join(",")!==[
   "eventId","runId","kind","actorId","evidenceRef","sourceSystemId",
   "status","sourceRecordId","tenantId","organizationId"
  ].sort().join(",")||
   ![record.tenantId,record.organizationId,record.eventId,record.runId,
     record.actorId,record.sourceSystemId,record.sourceRecordId].every(x=>
     typeof x==="string"&&ident.test(x))||
   !allowedKinds.has(record.kind)||!evidence.test(record.evidenceRef)||
   !["confirmed","rejected"].includes(record.status))
   throw Error("Invalid synthetic ERP fixture");
  return Object.freeze({...record});
 });
 return Object.freeze({
  async findEvidence(scope:EvidenceReadScope,refs:readonly string[]):Promise<readonly SourceReceipt[]>{
   if(!scope||![
    scope.tenantId,scope.organizationId,scope.sourceSystemId,scope.runId
   ].every(x=>typeof x==="string"&&ident.test(x))||
    !Array.isArray(refs)||refs.length>100||
    refs.some(x=>typeof x!=="string"||!evidence.test(x)))
    throw Error("Invalid synthetic ERP query");
   const wanted=new Set(refs);
   return records.filter(r=>
    r.tenantId===scope.tenantId&&r.organizationId===scope.organizationId&&
    r.sourceSystemId===scope.sourceSystemId&&r.runId===scope.runId&&
    wanted.has(r.evidenceRef)
   ).map(({tenantId:_tenantId,organizationId:_organizationId,...receipt})=>({...receipt}));
  }
 });
}
