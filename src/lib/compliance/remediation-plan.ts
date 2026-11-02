import type {ReviewTask} from "./compliance-review-queue";
export type RemediationState="proposed"|"assigned"|"in-progress"|"awaiting-review"|"approved"|"rejected";
export type RemediationAction={id:string;obligationId:string;description:string;priority:ReviewTask["priority"];state:RemediationState;ownerId:string|null;dueDate:string|null;reviewerId:string|null;approvedAt:string|null;sourceUrl:string;};
export function createRemediationPlan(tasks:readonly ReviewTask[]):RemediationAction[]{
 return tasks.map(t=>({
  id:"remediation:"+t.obligationId,obligationId:t.obligationId,
  description:t.taskType==="collect-evidence"?"Collect evidence and validate the underlying control":
    t.taskType==="verify-applicability"?"Determine legal applicability with supporting reasoning":
    "Perform substantive legal and operational review",
  priority:t.priority,state:"proposed",ownerId:null,dueDate:null,reviewerId:null,approvedAt:null,sourceUrl:t.sourceUrl
 }));
}
export function assignRemediation(action:RemediationAction,ownerId:string,dueDate:string):RemediationAction{
 if(action.state!=="proposed"||!ownerId.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)||
  Number.isNaN(Date.parse(dueDate+"T00:00:00Z"))||
  new Date(dueDate+"T00:00:00Z").toISOString().slice(0,10)!==dueDate)
  throw Error("Invalid remediation assignment");
 return {...action,state:"assigned",ownerId,dueDate};
}
export function advanceRemediation(action:RemediationAction,next:RemediationState,actorId:string,now:string):RemediationAction{
 if(!actorId.trim())throw Error("Actor required");
 const allowed:Record<RemediationState,RemediationState[]>={
  proposed:[],assigned:["in-progress"],"in-progress":["awaiting-review"],
  "awaiting-review":["approved","rejected"],approved:[],rejected:["in-progress"]};
 if(!allowed[action.state].includes(next))throw Error("Invalid remediation transition");
 if(!action.ownerId||!action.dueDate)throw Error("Unassigned remediation");
 if(next==="approved"||next==="rejected"){
  if(actorId===action.ownerId)throw Error("Self approval forbidden");
  if(!/^\d{4}-\d{2}-\d{2}T/.test(now)||Number.isNaN(Date.parse(now)))throw Error("Valid review timestamp required");
  return {...action,state:next,reviewerId:actorId,approvedAt:next==="approved"?now:null};
 }
 if(actorId!==action.ownerId)throw Error("Only owner can progress assigned action");
 return {...action,state:next,reviewerId:next==="in-progress"?null:action.reviewerId,
  approvedAt:null};
}
