import type {ObligationFinding} from "./regulatory-obligation-engine";
import {buildComplianceReviewQueue} from "./compliance-review-queue";
import {createRemediationPlan,assignRemediation} from "./remediation-plan";
export type DemoAssignment={ownerId:string;dueDate:string};
export function buildComplianceDashboardModel(input:{
 findings:readonly ObligationFinding[];
 assignments:Readonly<Record<string,DemoAssignment>>;
 referenceDate:string;
}){
 const tasks=buildComplianceReviewQueue(input.findings);
 const actions=createRemediationPlan(tasks).map(action=>{
  const assigned=input.assignments[action.obligationId];
  if(!assigned?.ownerId?.trim()||!assigned.dueDate)return action;
  try{return assignRemediation(action,assigned.ownerId.trim(),assigned.dueDate);}
  catch{return action;}
 });
 const dueDateIsValid=/^\d{4}-\d{2}-\d{2}$/.test(input.referenceDate);
 return {
  actions,
  taskCount:actions.length,
  highPriorityCount:actions.filter(a=>a.priority==="high").length,
  unknownApplicabilityCount:input.findings.filter(f=>f.status==="requires-evidence").length,
  possibleEvidenceGapCount:input.findings.filter(f=>f.status==="potential-gap").length,
  unassignedCount:actions.filter(a=>!a.ownerId).length,
  assignedCount:actions.filter(a=>!!a.ownerId).length,
  overdueCount:dueDateIsValid?actions.filter(a=>a.dueDate&&a.dueDate<input.referenceDate&&a.state!=="approved").length:null,
  legalViolationEstablished:false as const,
  dataScope:"local-unsaved-demo" as const
 };
}
