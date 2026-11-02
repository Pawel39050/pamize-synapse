import {createHash,randomUUID} from "node:crypto";
export type ReviewState="draft"|"submitted"|"approved"|"rejected";
export type AssessmentRecord={
 id:string;tenantId:string;organizationId:string;revision:number;
 state:ReviewState;createdAt:string;createdBy:string;payloadHash:string;
 previousRevisionHash:string|null;reviewedBy:string|null;reviewedAt:string|null;
};
export function createAssessmentDraft(input:{
 tenantId:string;organizationId:string;createdBy:string;payload:unknown;
 previous?:AssessmentRecord;
},now=new Date().toISOString()):AssessmentRecord{
 for(const id of [input.tenantId,input.organizationId,input.createdBy]){
  if(!/^[a-zA-Z0-9_-]{3,100}$/.test(id))throw Error("Invalid identifier");
 }
 if(input.previous&&(input.previous.tenantId!==input.tenantId||input.previous.organizationId!==input.organizationId))
  throw Error("Cross-tenant revision prohibited");
 const payload=JSON.stringify(input.payload);
 if(!payload||payload.length>200_000)throw Error("Invalid payload size");
 return {id:randomUUID(),tenantId:input.tenantId,organizationId:input.organizationId,
  revision:(input.previous?.revision??0)+1,state:"draft",createdAt:now,createdBy:input.createdBy,
  payloadHash:createHash("sha256").update(payload).digest("hex"),
  previousRevisionHash:input.previous?.payloadHash??null,reviewedBy:null,reviewedAt:null};
}
export function transitionAssessment(record:AssessmentRecord,to:ReviewState,actor:string,now=new Date().toISOString()):AssessmentRecord{
 if(!/^[a-zA-Z0-9_-]{3,100}$/.test(actor))throw Error("Invalid reviewer");
 const allowed:Record<ReviewState,ReviewState[]>={draft:["submitted"],submitted:["approved","rejected"],approved:[],rejected:[]};
 if(!allowed[record.state].includes(to))throw Error("Invalid review transition");
 if((to==="approved"||to==="rejected")&&actor===record.createdBy)throw Error("Self-approval prohibited");
 return {...record,state:to,reviewedBy:to==="approved"||to==="rejected"?actor:null,reviewedAt:to==="approved"||to==="rejected"?now:null};
}
