import "server-only";
import {assessRegulatoryObligations} from "../lib/compliance/regulatory-obligation-engine";
import {planRegulatoryImpact} from "../lib/compliance/regulatory-impact-planner";
export function ComplianceAgentsDemo(){
 const gdpr=assessRegulatoryObligations({organizationId:"DEMO-NOT-A-CUSTOMER",domain:"GDPR",applicability:{"gdpr-art-32":"yes"},evidence:{}});
 const ai=assessRegulatoryObligations({organizationId:"DEMO-NOT-A-CUSTOMER",domain:"AI_ACT",applicability:{"ai-act-art-4":"yes"},evidence:{}});
 const findings=[...gdpr,...ai];
 const actions=planRegulatoryImpact(findings,[{processId:"DEMO-CUSTOMER-SERVICE",processName:"Demonstracyjny proces obsługi klienta",ownerId:null,obligationIds:["gdpr-art-32","ai-act-art-4"]}]);
 return <section className="section-block panel">
   <div className="panel-top"><h2>Etap 4 · Współpraca agentów regulacyjnych</h2><span className="pill">DEMO · BEZ DANYCH KLIENTA</span></div>
   <p className="muted">Poniższy przypadek jest fikcyjny. Brak dowodu nie oznacza naruszenia prawa. Wszystkie wnioski wymagają oceny specjalisty.</p>
   <div className="kpi-grid">
     <div className="kpi"><span>RODO Agent</span><strong>{gdpr.length}</strong><small>Wstępnie oceniane obowiązki</small></div>
     <div className="kpi"><span>AI Act Agent</span><strong>{ai.length}</strong><small>Wstępnie oceniane obowiązki</small></div>
     <div className="kpi"><span>Regulatory Impact Analysis</span><strong>{actions.length}</strong><small>Zadania do weryfikacji</small></div>
   </div>
   <div className="agent-list">{actions.map(action=>{
     const finding=findings.find(x=>x.obligationId===action.obligationId);
     return <article className="model-card" key={action.processId+action.obligationId}>
       <h3>{finding?.article} · {action.processName}</h3>
       <p>{finding?.requirement}</p>
       <p><strong>Ocena wstępna:</strong> {finding?.status==="potential-gap"?"Możliwa luka dowodowa — niepotwierdzone naruszenie":finding?.status==="requires-evidence"?"Należy określić zastosowanie przepisu":"Do przeglądu przez eksperta"}</p>
       <p><strong>Rekomendowany kolejny krok:</strong> {action.action}</p>
       <p><a href={finding?.sourceUrl} target="_blank" rel="noopener noreferrer">Urzędowe źródło EUR-Lex</a></p>
       <small>Wymagane zatwierdzenie przez człowieka · Nie jest opinią prawną</small>
     </article>;
   })}</div>
 </section>;
}
