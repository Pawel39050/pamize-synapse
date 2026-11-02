import type {VerifiedPrincipal} from "./assessment-authorization.ts";
import type {RemediationLedger} from "./remediation-audit-ledger.ts";
import {appendRemediationEvent,canAccessRemediation,verifyRemediationLedger} from "./remediation-audit-ledger.ts";
import {assignRemediation,advanceRemediation,type RemediationAction} from "./remediation-plan.ts";
export type RemediationCommand=
 | {kind:"assign";actionId:string;expectedState:"proposed";ownerId:string;dueDate:string}
 | {kind:"progress";actionId:string;expectedState:"assigned"|"in-progress"|"rejected";to:"in-progress"|"awaiting-review"}
 | {kind:"review";actionId:string;expectedState:"awaiting-review";to:"approved"|"rejected"};
/** Pure application service. A trusted server must load principal and tenant-scoped ledger itself.
 * Do not accept principal, ledger or tenant from an HTTP request body. */
export function executeRemediationCommand(args:{ledger:RemediationLedger;principal:VerifiedPrincipal|null;command:RemediationCommand;at:string}):RemediationLedger{
 const {ledger,principal,command,at}=args;
 const operation=command.kind==="assign"?"assign":command.kind==="review"?"review":"progress";
 if(!canAccessRemediation(principal,ledger.tenantId,ledger.organizationId,operation))
  throw Error("Forbidden");
 if(!verifyRemediationLedger(ledger))throw Error("Corrupted audit log");
 const existing=ledger.actions.find(a=>a.id===command.actionId);
 if(!existing||existing.state!==command.expectedState)throw Error("Stale revision or action not found");
 let next:RemediationAction;
 if(command.kind==="assign"){
  if(principal!.subject!==command.ownerId)throw Error("Self-assignment only in Preview design");
  next=assignRemediation(existing,command.ownerId,command.dueDate);
 }else{
  if(command.kind==="review"&&principal!.subject===existing.ownerId)throw Error("Self-review denied");
  next=advanceRemediation(existing,command.to,principal!.subject,at);
 }
 return appendRemediationEvent({ledger,action:next,principal,operation,
  previousState:existing.state,at});
}
export function readAuthorizedRemediation(args:{ledger:RemediationLedger;principal:VerifiedPrincipal|null}):RemediationLedger{
 if(!canAccessRemediation(args.principal,args.ledger.tenantId,args.ledger.organizationId,"read"))
  throw Error("Forbidden");
 if(!verifyRemediationLedger(args.ledger))throw Error("Corrupted audit log");
 return args.ledger;
}
