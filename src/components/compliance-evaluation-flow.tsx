"use client";
import {useState} from "react";
import {initialAgents} from "../lib/catalog";
import {AiActRiskScreening} from "./ai-act-risk-screening";
import {ComplianceAssessmentWorkbench} from "./compliance-assessment-workbench";

/** One shared agent identity across screening, RODO obligations and draft card.
 * This is a demo registry definition, not a customer agent instance. */
export function ComplianceEvaluationFlow(){
 const defaultKey=initialAgents.some(a=>a.key==="AG-PRC-001")?"AG-PRC-001":initialAgents[0]?.key??"";
 const [agentKey,setAgentKey]=useState(defaultKey);
 return <>
  <div className="notice compact" role="note">
   <strong>Scenariusz demonstracyjny: Cyfrowy Pracownik Zakupów.</strong>
   <p>Analiza ofert i rekomendacja dostawcy; decyzje i zamówienia wymagają zatwierdzenia przez człowieka. W obu formularzach wybierasz tę samą definicję agenta z Agent Registry. Żadne dane nie trafiają do bazy klientów.</p>
  </div>
  <AiActRiskScreening agentKey={agentKey} onAgentChange={setAgentKey}/>
  <ComplianceAssessmentWorkbench agentKey={agentKey} onAgentChange={setAgentKey}/>
 </>;
}
