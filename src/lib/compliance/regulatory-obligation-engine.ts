export type RegulatoryDomain="GDPR"|"AI_ACT";
export type AgentRole="gdpr"|"ai-act"|"regulatory-impact";
export type FindingStatus="requires-evidence"|"potential-gap"|"review-required";
export type Obligation={
 id:string;domain:RegulatoryDomain;sourceUrl:string;article:string;
 requirement:string;applicabilityQuestion:string;requiredEvidence:string[];
};
export type AssessmentInput={
 organizationId:string;domain:RegulatoryDomain;
 applicability:Record<string,"yes"|"no"|"unknown">;
 evidence:Record<string,string[]>;
};
export type ObligationFinding={
 obligationId:string;sourceUrl:string;article:string;requirement:string;
 status:FindingStatus;missingEvidence:string[];reason:string;
 humanApprovalRequired:true;
};
const official=(url:string)=>{
 const u=new URL(url);
 if(u.protocol!=="https:"||u.hostname!=="eur-lex.europa.eu")throw Error("Official EUR-Lex URL required");
 return url;
};
export const OBLIGATIONS:readonly Obligation[]=[
 {id:"gdpr-art-30",domain:"GDPR",article:"Art. 30",sourceUrl:"https://eur-lex.europa.eu/eli/reg/2016/679/oj",requirement:"Maintain records of processing activities where applicable",applicabilityQuestion:"Is the organization subject to the relevant Article 30 recordkeeping obligation?",requiredEvidence:["processing-register"]},
 {id:"gdpr-art-32",domain:"GDPR",article:"Art. 32",sourceUrl:"https://eur-lex.europa.eu/eli/reg/2016/679/oj",requirement:"Implement appropriate technical and organizational security measures",applicabilityQuestion:"Does the organization process personal data as a controller or processor?",requiredEvidence:["security-controls","security-risk-assessment"]},
 {id:"gdpr-art-33",domain:"GDPR",article:"Art. 33",sourceUrl:"https://eur-lex.europa.eu/eli/reg/2016/679/oj",requirement:"Provide breach-notification procedures where applicable",applicabilityQuestion:"Is the organization a controller subject to breach notification duties?",requiredEvidence:["breach-response-procedure"]},
 {id:"ai-act-art-4",domain:"AI_ACT",article:"Art. 4",sourceUrl:"https://eur-lex.europa.eu/eli/reg/2024/1689/oj",requirement:"Take measures to ensure sufficient AI literacy for personnel and others operating AI systems on the organization's behalf",applicabilityQuestion:"Is the organization a provider or deployer of AI systems?",requiredEvidence:["ai-literacy-measures"]},
 {id:"ai-act-art-9",domain:"AI_ACT",article:"Art. 9",sourceUrl:"https://eur-lex.europa.eu/eli/reg/2024/1689/oj",requirement:"Establish a risk management system where required for a high-risk AI system",applicabilityQuestion:"Is the organization a provider of an AI system classified as high-risk under applicable provisions?",requiredEvidence:["ai-risk-management-system"]}
];
export function assessRegulatoryObligations(input:AssessmentInput, obligations:readonly Obligation[]=OBLIGATIONS):ObligationFinding[]{
 if(!input.organizationId.trim())throw Error("Organization identifier required");
 return obligations.filter(o=>o.domain===input.domain).map(o=>{
  official(o.sourceUrl);
  const applicable=input.applicability[o.id]??"unknown";
  const provided=new Set(input.evidence[o.id]??[]);
  const missing=o.requiredEvidence.filter(e=>!provided.has(e));
  const status:FindingStatus=applicable==="unknown"?"requires-evidence":applicable==="no"?"review-required":missing.length?"potential-gap":"review-required";
  const reason=applicable==="unknown"?"Applicability not established":applicable==="no"?"Reported not applicable; requires independent review":missing.length?"Potential gap: required evidence not supplied":"Evidence references supplied; substantive compliance not yet verified";
  return {obligationId:o.id,sourceUrl:o.sourceUrl,article:o.article,requirement:o.requirement,status,missingEvidence:missing,reason,humanApprovalRequired:true};
 });
}
