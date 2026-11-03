import {auditProcurementEvents,type ProcurementEvent,type ProcurementEventKind,type EventAuditResult} from "./procurement-event-audit.ts";
/**
 * Strict local adapter for external agent event JSON.
 * Not an authenticated ingestion endpoint; NO provenance or signature validation.
 * Only anonymized, synthetic event metadata is allowed in this Preview importer.
 */
export const MAX_LOCAL_EVENT_BYTES=32_768;
export const MAX_LOCAL_EVENTS=100;
const kinds:readonly ProcurementEventKind[]=[
 "request-created","criteria-approved","rfq-prepared","offers-received",
 "recommendation-issued","human-approved","order-sent"
];
const ident=/^[A-Za-z0-9_-]{3,64}$/;
const evidence=/^[A-Za-z0-9_:/.-]{3,120}$/;
const exact=(obj:Record<string,unknown>,fields:readonly string[])=>Object.keys(obj).length===fields.length&&
 fields.every(key=>Object.prototype.hasOwnProperty.call(obj,key));
const isRecord=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==="object"&&!Array.isArray(v);
export type LocalEventReview={events:ProcurementEvent[];audit:EventAuditResult;source:"unverified-local-json"};
export function parseLocalProcurementEvents(raw:string):LocalEventReview{
 if(typeof raw!=="string"||raw.length>MAX_LOCAL_EVENT_BYTES||raw.length<2)throw Error("Invalid input size (maximum 32 KB)");
 let parsed:unknown;
 try{parsed=JSON.parse(raw)}catch{throw Error("Invalid JSON format")}
 if(!isRecord(parsed)||!exact(parsed,["schemaVersion","agentKey","events"])||
  parsed.schemaVersion!=="1"||parsed.agentKey!=="AG-PRC-001")
  throw Error("Expected version 1 and demo agent AG-PRC-001");
 if(!Array.isArray(parsed.events)||parsed.events.length<1||parsed.events.length>MAX_LOCAL_EVENTS)
  throw Error("Invalid event count (1–100)");
 const validated:ProcurementEvent[]=parsed.events.map((item:unknown)=>{
  if(!isRecord(item)||!exact(item,["id","runId","sequence","at","kind","actorId","evidenceRef"]))
   throw Error("Event fields do not match the allowed metadata schema");
  for(const key of ["id","runId","actorId"]){
   if(typeof item[key]!=="string"||!ident.test(item[key] as string))throw Error("Invalid "+key);
  }
  if(!Number.isSafeInteger(item.sequence)||(item.sequence as number)<1||(item.sequence as number)>MAX_LOCAL_EVENTS)
   throw Error("Invalid event sequence");
  if(typeof item.kind!=="string"||!kinds.includes(item.kind as ProcurementEventKind))throw Error("Unknown event kind");
  if(typeof item.at!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,3})?Z$/.test(item.at)||!Number.isFinite(Date.parse(item.at))||new Date(item.at).toISOString().slice(0,19)!==item.at.slice(0,19))
   throw Error("Timestamp must be a valid UTC ISO 8601 string");
  if(item.evidenceRef!==null&&(typeof item.evidenceRef!=="string"||!evidence.test(item.evidenceRef)))
   throw Error("Evidence references must be short identifiers, not documents or personal data");
  return {id:item.id as string,runId:item.runId as string,sequence:item.sequence as number,
   at:item.at as string,kind:item.kind as ProcurementEventKind,
   actorId:item.actorId as string,evidenceRef:item.evidenceRef as string|null};
 });
 return {events:validated,audit:auditProcurementEvents(validated),source:"unverified-local-json"};
}
