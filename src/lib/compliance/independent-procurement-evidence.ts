import type {ProcurementEvent,EventAuditResult} from "./procurement-event-audit.ts";

/**
 * Independent evidence reconciliation for the procurement-agent Preview.
 * Source receipts MUST be supplied by a separately authenticated read-only ERP adapter,
 * not by the agent submitting its event log. This module has no ERP connection and
 * cannot establish authenticity of the supplied receipts on its own.
 */
export type SourceReceipt={
  eventId:string;runId:string;kind:ProcurementEvent["kind"];
  actorId:string;evidenceRef:string;sourceSystemId:string;
  status:"confirmed"|"rejected";sourceRecordId:string;
};
export type SourceEvidenceResult={
  status:"blocked"|"review-required";
  sourceAuthenticated:boolean;
  matched:number;
  expected:number;
  issues:{code:"SOURCE_NOT_AUTHENTICATED"|"NO_SOURCE_RECEIPT"|"SOURCE_REJECTED"|
    "RECEIPT_MISMATCH"|"DUPLICATE_RECEIPT"|"UNEXPECTED_RECEIPT"|"MISSING_EVIDENCE_REFERENCE";
    eventId:string|null;haltRecommended:boolean;description:string}[];
};
const sourceId=/^[A-Za-z0-9_-]{3,80}$/;
const ref=/^[A-Za-z0-9_:/.-]{3,120}$/;
const receiptFields=["eventId","runId","kind","actorId","evidenceRef","sourceSystemId","status","sourceRecordId"];
export function reconcileIndependentSourceEvidence(input:{
 events:readonly ProcurementEvent[];
 receipts:readonly SourceReceipt[];
 trustedSourceSystemId:string|null;
 sourceAuthenticated:boolean;
 audit:EventAuditResult;
}):SourceEvidenceResult{
 const {events,receipts,trustedSourceSystemId,sourceAuthenticated,audit}=input;
 if(!Array.isArray(events)||!Array.isArray(receipts)||events.length<1||
  !audit||audit.runId!==events[0].runId||receipts.length>100||
  !events.every(e=>e.runId===audit.runId)||
  (trustedSourceSystemId!==null&&!sourceId.test(trustedSourceSystemId)))
  throw Error("Invalid independent evidence context");
 const issues:SourceEvidenceResult["issues"]=[];
 const add=(code:SourceEvidenceResult["issues"][number]["code"],eventId:string|null,description:string,haltRecommended=false)=>
  issues.push({code,eventId,description,haltRecommended});
 if(!sourceAuthenticated||!trustedSourceSystemId){
  add("SOURCE_NOT_AUTHENTICATED",null,"Nie potwierdzono niezależnego źródła dowodów.");
 }
 const byEvent=new Map<string,SourceReceipt[]>();
 for(const r of receipts){
  if(!r||Object.keys(r).sort().join(",")!==[...receiptFields].sort().join(",")||
   !sourceId.test(r.eventId)||!sourceId.test(r.runId)||!sourceId.test(r.actorId)||
   !sourceId.test(r.sourceSystemId)||!sourceId.test(r.sourceRecordId)||
   !ref.test(r.evidenceRef)||!["confirmed","rejected"].includes(r.status)){
   throw Error("Malformed source receipt");
  }
  byEvent.set(r.eventId,[...(byEvent.get(r.eventId)??[]),r]);
 }
 let matched=0;
 for(const event of events){
  const items=byEvent.get(event.id)??[];
  if(!event.evidenceRef){
   add("MISSING_EVIDENCE_REFERENCE",event.id,"Zdarzenie nie wskazuje dowodu.");
   continue;
  }
  if(items.length===0){add("NO_SOURCE_RECEIPT",event.id,"Brak potwierdzenia zdarzenia w niezależnym źródle.");continue;}
  if(items.length>1){add("DUPLICATE_RECEIPT",event.id,"Wiele potwierdzeń dla tego samego zdarzenia.",true);continue;}
  const r=items[0];
  if(r.status==="rejected"){add("SOURCE_REJECTED",event.id,"Źródło odrzuciło przypisany dowód.",true);continue;}
  if(r.runId!==event.runId||r.kind!==event.kind||r.actorId!==event.actorId||
   r.evidenceRef!==event.evidenceRef||r.sourceSystemId!==trustedSourceSystemId){
   add("RECEIPT_MISMATCH",event.id,"Niezależne źródło nie potwierdza tożsamości, rodzaju lub referencji zdarzenia.",true);
   continue;
  }
  if(sourceAuthenticated)matched++;
 }
 for(const eventId of byEvent.keys())
  if(!events.some(e=>e.id===eventId))add("UNEXPECTED_RECEIPT",eventId,"Potwierdzenie nie ma odpowiednika w dzienniku.",true);
 return {
  status:audit.status==="blocked"||issues.some(x=>x.haltRecommended)?"blocked":"review-required",
  sourceAuthenticated:Boolean(sourceAuthenticated&&trustedSourceSystemId),
  matched,expected:events.length,issues
 };
}
