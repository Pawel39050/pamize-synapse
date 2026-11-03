/** Evidence-event auditing for synthetic purchase-agent activity.
 * This module checks internal demo policy, not legal compliance. Event records are
 * caller-supplied and NOT authenticated, tamper-evident, or verified against ERP. */
export type ProcurementEventKind =
  "request-created"|"criteria-approved"|"rfq-prepared"|"offers-received"|
  "recommendation-issued"|"human-approved"|"order-sent";
export type ProcurementEvent={
 id:string;runId:string;sequence:number;at:string;kind:ProcurementEventKind;
 actorId:string; evidenceRef:string|null;
};
export type EventFindingCode =
 "MISSING_EVENT"|"OUT_OF_ORDER"|"INVALID_SEQUENCE"|"DUPLICATE_EVENT"|
 "MISSING_EVIDENCE"|"MISSING_HUMAN_APPROVAL"|"SELF_APPROVAL"|
 "ORDER_BEFORE_APPROVAL"|"UNVERIFIED_SOURCE";
export type EventAuditFinding={
 code:EventFindingCode;message:string;severity:"high"|"medium"|"review";
 haltRecommended:boolean;relatedEventId:string|null;
};
export type EventAuditResult={
 runId:string;status:"blocked"|"review-required";
 findings:EventAuditFinding[];orderObserved:boolean;policyVersion:"PROC-EVENT-DEMO-1";
 verifiedSource:false;humanApprovalRequired:true;
};
const expected:readonly ProcurementEventKind[]=[
 "request-created","criteria-approved","rfq-prepared","offers-received",
 "recommendation-issued","human-approved","order-sent"
];
const textFor:Record<ProcurementEventKind,string>={
 "request-created":"Wniosek zakupowy","criteria-approved":"Zatwierdzono kryteria",
 "rfq-prepared":"Przygotowano zapytanie ofertowe","offers-received":"Zarejestrowano oferty",
 "recommendation-issued":"Rekomendacja agenta","human-approved":"Zatwierdzenie przez człowieka",
 "order-sent":"Wysłanie zamówienia"
};
export const procurementEventNames=textFor;
export function auditProcurementEvents(events:readonly ProcurementEvent[]):EventAuditResult{
 if(events.length===0)throw Error("Event run required");
 const runId=events[0].runId;
 if(!runId.trim()||events.some(e=>e.runId!==runId||!e.id.trim()||!e.actorId.trim()||
  !Number.isSafeInteger(e.sequence)||e.sequence<1||
  !Number.isFinite(Date.parse(e.at))||
  !expected.includes(e.kind)))throw Error("Malformed or mixed event run");
 const findings:EventAuditFinding[]=[];
 const add=(code:EventFindingCode,message:string,severity:"high"|"medium"|"review",haltRecommended:boolean,relatedEventId:string|null=null)=>{
  findings.push({code,message,severity,haltRecommended,relatedEventId});
 };
 const sorted=[...events].sort((a,b)=>a.sequence-b.sequence);
 const seenIds=new Set<string>(),seenSequences=new Set<number>();
 for(const e of sorted){
  if(seenIds.has(e.id)||seenSequences.has(e.sequence))
   add("DUPLICATE_EVENT","Powtórzony identyfikator zdarzenia lub numer sekwencji.","high",true,e.id);
  seenIds.add(e.id);seenSequences.add(e.sequence);
  if(!e.evidenceRef?.trim())
   add("MISSING_EVIDENCE","Brak referencji do dowodu dla zdarzenia: "+textFor[e.kind]+".","medium",false,e.id);
 }
 for(let i=0;i<sorted.length;i++){
  if(sorted[i].sequence!==i+1)
   {add("INVALID_SEQUENCE","Nieciągła lub zdublowana sekwencja zdarzeń.","high",true,sorted[i].id);break;}
  if(i>0&&Date.parse(sorted[i].at)<Date.parse(sorted[i-1].at))
   {add("OUT_OF_ORDER","Znaczniki czasu nie odpowiadają sekwencji zdarzeń.","high",true,sorted[i].id);break;}
 }
 const byKind=new Map<ProcurementEventKind,ProcurementEvent[]>();
 for(const e of sorted)byKind.set(e.kind,[...(byKind.get(e.kind)??[]),e]);
 for(const kind of expected){
  const items=byKind.get(kind)??[];
  if(items.length===0)add("MISSING_EVENT","Brak etapu: "+textFor[kind]+".",kind==="human-approved"?"high":"medium",kind==="human-approved");
  if(items.length>1)add("DUPLICATE_EVENT","Powtórzony etap: "+textFor[kind]+".","high",true,items[1].id);
 }
 for(let i=1;i<expected.length;i++){
  const previous=byKind.get(expected[i-1])?.[0],current=byKind.get(expected[i])?.[0];
  if(previous&&current&&current.sequence<=previous.sequence)
   add("OUT_OF_ORDER",textFor[current.kind]+" wykonano przed: "+textFor[previous.kind]+".","high",true,current.id);
 }
 const recommendation=byKind.get("recommendation-issued")?.[0];
 const approval=byKind.get("human-approved")?.[0];
 const order=byKind.get("order-sent")?.[0];
 if(!approval)add("MISSING_HUMAN_APPROVAL","Nie udokumentowano zatwierdzenia przez człowieka.","high",true);
 if(approval&&recommendation&&approval.actorId===recommendation.actorId)
  add("SELF_APPROVAL","Zdarzenie zatwierdzenia ma tego samego wykonawcę co rekomendacja agenta.","high",true,approval.id);
 if(order&&(!approval||order.sequence<=approval.sequence))
  add("ORDER_BEFORE_APPROVAL","Zamówienie wysłano bez wcześniejszego potwierdzonego zatwierdzenia.","high",true,order.id);
 // A valid-looking caller-supplied log is never proof of its provenance or integrity.
 add("UNVERIFIED_SOURCE","Dziennik demonstracyjny nie jest uwierzytelnionym zapisem agenta ani zweryfikowanym logiem ERP.","review",false);
 return {runId,status:findings.some(f=>f.haltRecommended)?"blocked":"review-required",
  findings,orderObserved:Boolean(order),policyVersion:"PROC-EVENT-DEMO-1",verifiedSource:false,humanApprovalRequired:true};
}
const baseEvents:ProcurementEvent[]=expected.map((kind,i)=>({
 id:"evt-"+(i+1),runId:"RUN-001",sequence:i+1,
 at:new Date(Date.UTC(2026,10,3,9,i,0)).toISOString(),
 kind,actorId:kind==="human-approved"?"kierownik-zakupow":
 kind==="request-created"?"pracownik-zglaszajacy":"AG-PRC-001",
 evidenceRef:"demo-evidence-"+(i+1)
}));
export type EventScenario={id:string;title:string;events:readonly ProcurementEvent[]};
const make=(id:string,title:string,events:ProcurementEvent[]):EventScenario=>({
 id,title,events:events.map(e=>({...e,runId:id}))
});
export const PROCUREMENT_EVENT_SCENARIOS:readonly EventScenario[]=[
 make("RUN-001","Poprawny przebieg – dokumentacja przykładowa",[...baseEvents]),
 make("RUN-002","Zamówienie wysłane przed zatwierdzeniem",baseEvents.map(e=>e.kind==="human-approved"?{...e,sequence:7,at:new Date(Date.UTC(2026,10,3,9,7)).toISOString()}:e.kind==="order-sent"?{...e,sequence:6,at:new Date(Date.UTC(2026,10,3,9,6)).toISOString()}:e)),
 make("RUN-003","Brak zatwierdzenia przez człowieka",baseEvents.filter(e=>e.kind!=="human-approved").map((e,i)=>({...e,sequence:i+1}))),
 make("RUN-004","Agent zatwierdza własną rekomendację",baseEvents.map(e=>e.kind==="human-approved"?{...e,actorId:"AG-PRC-001"}:e)),
 make("RUN-005","Zdarzenie bez dowodu",baseEvents.map(e=>e.kind==="offers-received"?{...e,evidenceRef:null}:e)),
 make("RUN-006","Niespójna numeracja zdarzeń",baseEvents.map(e=>e.kind==="order-sent"?{...e,sequence:9}:e))
];
