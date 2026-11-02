import type {ObligationFinding} from "./regulatory-obligation-engine";
export type ReviewPriority="high"|"medium"|"normal";
export type ReviewTask={
 obligationId:string;article:string;priority:ReviewPriority;
 taskType:"verify-applicability"|"collect-evidence"|"substantive-review";
 reason:string;sourceUrl:string;humanApprovalRequired:true;
 /** A worklist item is not a legal breach determination. */ legalViolationEstablished:false;
};
export function buildComplianceReviewQueue(findings:readonly ObligationFinding[]):ReviewTask[]{
 const seen=new Set<string>();
 const tasks:ReviewTask[]=findings.map(f=>{
  if(seen.has(f.obligationId))throw Error("Duplicate obligation review");
  seen.add(f.obligationId);
  if(!["requires-evidence","potential-gap","review-required"].includes(f.status))throw Error("Unrecognized finding status");
  const taskType:ReviewTask["taskType"]=
   f.status==="requires-evidence"?"verify-applicability":
   f.status==="potential-gap"?"collect-evidence":"substantive-review";
  const priority:ReviewPriority=f.status==="potential-gap"?"high":
    f.status==="requires-evidence"?"medium":"normal";
  return {obligationId:f.obligationId,article:f.article,priority,taskType,
    reason:f.reason,sourceUrl:f.sourceUrl,humanApprovalRequired:true,
    legalViolationEstablished:false};
 });
 const order:Record<ReviewPriority,number>={high:0,medium:1,normal:2};
 return tasks.sort((a,b)=>order[a.priority]-order[b.priority]||
   a.obligationId.localeCompare(b.obligationId));
}
