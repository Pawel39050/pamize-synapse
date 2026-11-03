import type {ProcurementEvent,ProcurementEventKind} from "./procurement-event-audit.ts";

/** Executable, isolated purchase-worker simulator.
 * Commands generate events at execution time; no email, ERP call, order transmission,
 * real suppliers, or external side effects. Human approval is an explicit external input.
 * The audit deliberately runs over observed events, not a hand-written scenario log.
 */
export type WorkerCommand={
 kind:ProcurementEventKind;
 actorId:string;
 evidenceRef:string|null;
};
const stages:readonly ProcurementEventKind[]=[
 "request-created","criteria-approved","rfq-prepared","offers-received",
 "recommendation-issued","human-approved","order-sent"
];
const ids=/^[A-Za-z0-9_-]{3,64}$/;
const evidence=/^[A-Za-z0-9_:/.-]{3,120}$/;
export class IsolatedProcurementWorker{
 readonly events:ProcurementEvent[]=[];
 readonly runId:string;
 private readonly startedAt:number;
 constructor(runId:string,startedAt=Date.parse("2026-11-03T09:00:00.000Z")){
  if(!ids.test(runId)||!Number.isSafeInteger(startedAt)||!Number.isFinite(startedAt))
   throw Error("Invalid synthetic run identity");
  this.runId=runId;this.startedAt=startedAt;
 }
 execute(command:WorkerCommand):ProcurementEvent{
  if(!command||!stages.includes(command.kind)||!ids.test(command.actorId)||
   (command.evidenceRef!==null&&(!command.evidenceRef||!evidence.test(command.evidenceRef))))
   throw Error("Invalid synthetic command");
  if(command.kind==="human-approved"&&command.actorId==="AG-PRC-001")
   throw Error("Agent cannot create human approval");
  if(command.kind!=="human-approved"&&command.kind!=="request-created"&&command.actorId!=="AG-PRC-001")
   throw Error("Only agent executes worker operations");
  if(this.events.some(e=>e.kind===command.kind))throw Error("Repeated synthetic stage");
  const index=this.events.length+1;
  const event:ProcurementEvent={
   id:"event-"+index,runId:this.runId,sequence:index,
   at:new Date(this.startedAt+index*1000).toISOString(),
   kind:command.kind,actorId:command.actorId,evidenceRef:command.evidenceRef
  };
  this.events.push(event);
  return event;
 }
 snapshot():readonly ProcurementEvent[]{return this.events.map(e=>({...e}));}
}
/** A deliberate defect run can attempt to send an order before human approval.
 * The event denotes an *attempt in the sandbox*, not an actual external send.
 * This harness does not enforce procurement policy; Guardian independently flags it.
 */
export function executeSyntheticPurchase(runId:string,variant:"normal"|"early-order"|"missing-approval"|"missing-evidence"="normal"){
 const worker=new IsolatedProcurementWorker(runId);
 const steps:ProcurementEventKind[]=[
  "request-created","criteria-approved","rfq-prepared","offers-received",
  "recommendation-issued",
  ...(variant==="missing-approval"?[]:variant==="early-order"?["order-sent","human-approved"]:["human-approved","order-sent"]) as ProcurementEventKind[]
 ];
 for(const kind of steps){
  worker.execute({
   kind,
   actorId:kind==="request-created"?"requester-demo":kind==="human-approved"?"approver-demo":"AG-PRC-001",
   evidenceRef:variant==="missing-evidence"&&kind==="offers-received"?null:"synthetic-"+kind
  });
 }
 if(variant==="missing-approval")worker.execute({kind:"order-sent",actorId:"AG-PRC-001",evidenceRef:"synthetic-order-attempt"});
 return worker.snapshot();
}
