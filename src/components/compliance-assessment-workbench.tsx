"use client";
import {useMemo,useState} from "react";
import {OBLIGATIONS,assessRegulatoryObligations,type RegulatoryDomain} from "../lib/compliance/regulatory-obligation-engine";
import {planRegulatoryImpact} from "../lib/compliance/regulatory-impact-planner";
import {ComplianceManagementDashboard} from "./compliance-management-dashboard";

/** Local-only diagnostics. No company data are submitted to a server or persisted. */
export function ComplianceAssessmentWorkbench(){
 const [domain,setDomain]=useState<RegulatoryDomain>("GDPR");
 const [answers,setAnswers]=useState<Record<string,"yes"|"no"|"unknown">>({});
 const [evidence,setEvidence]=useState<Record<string,string[]>>({});
 const [processName,setProcessName]=useState("Przykładowy proces");
 const catalog=OBLIGATIONS.filter(o=>o.domain===domain);
 const allFindings=useMemo(()=>[
   ...assessRegulatoryObligations({organizationId:"LOCAL-UNSAVED-ASSESSMENT",domain:"GDPR",applicability:answers,evidence}),
   ...assessRegulatoryObligations({organizationId:"LOCAL-UNSAVED-ASSESSMENT",domain:"AI_ACT",applicability:answers,evidence})
 ],[answers,evidence]);
 const findings=allFindings.filter(f=>catalog.some(o=>o.id===f.obligationId));
 const actions=useMemo(()=>planRegulatoryImpact(findings,[{
   processId:"LOCAL-PROCESS",processName:processName.trim()||"Proces bez nazwy",
   ownerId:null,obligationIds:catalog.map(o=>o.id)
 }]),[findings,processName,domain]);
 return <><section className="section-block panel">
   <div className="panel-top"><h2>Diagnostyka zgodności · wersja testowa</h2><span className="pill">LOKALNIE · BEZ ZAPISU</span></div>
   <p className="muted">Wspólny dashboard podsumowuje RODO i AI Act; poniższy formularz pokazuje wybrany obszar. Wstępna analiza, nie opinia prawna. Wpisane odpowiedzi i nazwa procesu nie są wysyłane do Neon ani zapisywane na serwerze. Korzystaj wyłącznie z przykładowych lub niesensytywnych danych.</p>
   <div className="notice compact">
     <label htmlFor="compliance-domain">Obszar prawny: </label>
     <select id="compliance-domain" value={domain} onChange={e=>setDomain(e.target.value as RegulatoryDomain)}>
       <option value="GDPR">RODO</option><option value="AI_ACT">AI Act</option>
     </select>
     <p><label htmlFor="compliance-process">Nazwa procesu: </label>
       <input id="compliance-process" maxLength={100} value={processName} onChange={e=>setProcessName(e.target.value)} /></p>
   </div>
   <div className="agent-list">{catalog.map(o=><article className="model-card" key={o.id}>
     <h3>{o.article} · {o.requirement}</h3>
     <p>{o.applicabilityQuestion}</p>
     <label htmlFor={"app-"+o.id}>Czy obowiązek ma zastosowanie? </label>
     <select id={"app-"+o.id} value={answers[o.id]??"unknown"}
       onChange={e=>setAnswers(a=>({...a,[o.id]:e.target.value as "yes"|"no"|"unknown"}))}>
       <option value="unknown">Nie ustalono</option><option value="yes">Prawdopodobnie tak</option>
       <option value="no">Prawdopodobnie nie — do potwierdzenia</option>
     </select>
     <p><strong>Posiadane dowody / dokumenty (deklaracja, bez przesyłania plików):</strong></p>
     {o.requiredEvidence.map(key=><label key={key} style={{display:"block"}}>
       <input type="checkbox" checked={(evidence[o.id]??[]).includes(key)} onChange={event=>setEvidence(current=>{
         const set=new Set(current[o.id]??[]);
         if(event.target.checked)set.add(key);else set.delete(key);
         return {...current,[o.id]:[...set]};
       })}/> {key}
     </label>)}
     <p><a href={o.sourceUrl} target="_blank" rel="noopener noreferrer">Tekst rozporządzenia w EUR-Lex</a></p>
   </article>)}</div>
   <h3>Wstępny raport agenta Regulatory Impact Analysis</h3>
   <div className="kpi-grid">
     <div className="kpi"><span>Badane obowiązki</span><strong>{findings.length}</strong></div>
     <div className="kpi"><span>Potencjalne luki dowodowe</span><strong>{findings.filter(x=>x.status==="potential-gap").length}</strong></div>
     <div className="kpi"><span>Wymaga ustalenia zastosowania</span><strong>{findings.filter(x=>x.status==="requires-evidence").length}</strong></div>
   </div>
   <div className="agent-list">{actions.map(a=>{
     const f=findings.find(x=>x.obligationId===a.obligationId);
     return <article className="model-card" key={a.obligationId}>
       <h4>{f?.article} · {a.processName}</h4>
       <p><strong>Status:</strong> {f?.status==="potential-gap"?"Możliwa luka dowodowa":f?.status==="requires-evidence"?"Zastosowanie nieustalone":"Wymagana kontrola eksperta"}</p>
       <p><strong>Brakujące dowody:</strong> {f?.missingEvidence.join(", ")||"Brak wskazanych braków — jakość dowodów niezweryfikowana"}</p>
       <p><strong>Następny krok:</strong> {a.action}</p>
       <small>Ocena wstępna · obowiązkowa akceptacja człowieka</small>
     </article>;
   })}</div>
   <button type="button" onClick={()=>{setAnswers({});setEvidence({});setProcessName("Przykładowy proces");}}>Wyczyść lokalną diagnozę</button>
 </section><ComplianceManagementDashboard findings={allFindings}/></>;
}
