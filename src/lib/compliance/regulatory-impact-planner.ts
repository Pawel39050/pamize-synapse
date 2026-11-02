import type {ObligationFinding} from "./regulatory-obligation-engine.ts";
export type ProcessExposure={processId:string;processName:string;obligationIds:string[];ownerId:string|null};
export type ImpactAction={processId:string;processName:string;obligationId:string;priority:"triage"|"review";action:string;ownerId:string|null;approvalRequired:true};
export function planRegulatoryImpact(findings:readonly ObligationFinding[], processes:readonly ProcessExposure[]):ImpactAction[]{
 const byId=new Map(findings.map(f=>[f.obligationId,f]));
 const actions:ImpactAction[]=[];
 const seen=new Set<string>();
 for(const process of processes){
  if(!process.processId.trim()||!process.processName.trim())throw Error("Identifiable process required");
  for(const id of process.obligationIds){
   const f=byId.get(id);
   if(!f)continue;
   const key=process.processId+"|"+id;
   if(seen.has(key))continue;
   seen.add(key);
   const priority=f.status==="potential-gap"||f.status==="requires-evidence"?"triage":"review";
   actions.push({processId:process.processId,processName:process.processName,obligationId:id,priority,ownerId:process.ownerId,
     action:priority==="triage"?"Collect applicability and supporting evidence; assign expert reviewer":"Validate legal applicability and quality of supplied evidence",
     approvalRequired:true});
  }
 }
 return actions;
}
