import {createHash,randomUUID} from "node:crypto";
import type {VerifiedPrincipal} from "./assessment-authorization";
import type {RemediationAction,RemediationState} from "./remediation-plan";
export type RemediationEvent={
 id:string;actionId:string;tenantId:string;organizationId:string;
 from:RemediationState|null;to:RemediationState;actorId:string;occurredAt:string;
 previousHash:string|null;hash:string;
};
export type RemediationLedger={tenantId:string;organizationId:string;actions:RemediationAction[];events:RemediationEvent[]};
export function canAccessRemediation(principal:VerifiedPrincipal|null,tenantId:string,organizationId:string,operation:"read"|"assign"|"progress"|"review"):boolean{
 if(!principal||principal.issuer!=="entra-id-verified"||principal.tenantId!==tenantId||
  !principal.organizationIds.includes(organizationId))return false;
 return operation==="read"?principal.roles.some(r=>["author","reviewer","viewer"].includes(r)):
  operation==="review"?principal.roles.includes("reviewer"):principal.roles.includes("author");
}
export function appendRemediationEvent(args:{
 ledger:RemediationLedger;action:RemediationAction;principal:VerifiedPrincipal|null;
 operation:"assign"|"progress"|"review";previousState:RemediationState|null;at:string;
}):RemediationLedger{
 const {ledger,action,principal,operation,previousState,at}=args;
 if(!canAccessRemediation(principal,ledger.tenantId,ledger.organizationId,operation))
  throw Error("Unauthorized remediation action");
 const current=ledger.actions.find(a=>a.id===action.id);
 if(!current||current.state!==previousState)throw Error("Stale remediation transition");
 if(!verifyRemediationLedger(ledger))throw Error("Audit ledger integrity failure");
 const valid:Record<RemediationState,RemediationState[]>={proposed:["assigned"],assigned:["in-progress"],"in-progress":["awaiting-review"],"awaiting-review":["approved","rejected"],approved:[],rejected:["in-progress"]};
 if(!valid[current.state].includes(action.state))throw Error("Invalid state transition");
 if(operation==="review"&&(action.state!=="approved"&&action.state!=="rejected"||
   principal!.subject===current.ownerId))throw Error("Independent reviewer required");
 if(operation==="assign"&&action.state!=="assigned"||
    operation==="progress"&&!["in-progress","awaiting-review"].includes(action.state))
  throw Error("Invalid operation/state combination");
 if(operation==="progress"&&principal!.subject!==current.ownerId)throw Error("Only owner can progress action");
 if(operation==="assign"&&(!action.ownerId||!action.dueDate))throw Error("Owner and deadline required");
 if(!Number.isFinite(Date.parse(at)))throw Error("Invalid audit timestamp");
 const last=ledger.events.at(-1);
 const eventBase={id:randomUUID(),actionId:action.id,tenantId:ledger.tenantId,
  organizationId:ledger.organizationId,from:previousState,to:action.state,
  actorId:principal!.subject,occurredAt:at,previousHash:last?.hash??null};
 const hash=createHash("sha256").update(JSON.stringify(eventBase)).digest("hex");
 return {...ledger,actions:ledger.actions.map(a=>a.id===action.id?action:a),
  events:[...ledger.events,{...eventBase,hash}]};
}
export function verifyRemediationLedger(ledger:RemediationLedger):boolean{
 let previous:string|null=null;
 for(const event of ledger.events){
  if(event.tenantId!==ledger.tenantId||event.organizationId!==ledger.organizationId||
    event.previousHash!==previous)return false;
  const {hash,...base}=event;
  if(createHash("sha256").update(JSON.stringify(base)).digest("hex")!==hash)return false;
  previous=hash;
 }
 return true;
}
// Design-only audit model. No customer writes or unverified database access.
