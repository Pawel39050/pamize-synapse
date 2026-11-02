"use client";
import {useMemo,useState} from "react";
import type {ObligationFinding} from "../lib/compliance/regulatory-obligation-engine";
import {buildComplianceReviewQueue} from "../lib/compliance/compliance-review-queue";
import {createRemediationPlan,assignRemediation,type RemediationAction} from "../lib/compliance/remediation-plan";

const priorityName={high:"Wysoki",medium:"Średni",normal:"Standardowy"} as const;
const stateName={proposed:"Propozycja",assigned:"Przydzielone","in-progress":"W realizacji","awaiting-review":"Do oceny",approved:"Zatwierdzone",rejected:"Odrzucone"} as const;

/** Self-contained Preview dashboard derived only from local, unsaved diagnostic answers. */
export function ComplianceManagementDashboard({findings}:{findings:readonly ObligationFinding[]}){
 const [assignments,setAssignments]=useState<Record<string,{ownerId:string;dueDate:string}>>({});
 const [priorityFilter,setPriorityFilter]=useState("all");
 const [ownerSearch,setOwnerSearch]=useState("");
 const [today,setToday]=useState("");
 const [errors,setErrors]=useState<Record<string,string>>({});
 const tasks=useMemo(()=>buildComplianceReviewQueue(findings),[findings]);
 const plan=useMemo(()=>createRemediationPlan(tasks).map(action=>{
  const assignment=assignments[action.obligationId];
  if(!assignment)return action;
  try{return assignRemediation(action,assignment.ownerId,assignment.dueDate);}
  catch{return action;}
 }),[tasks,assignments]);
 const visible=plan.filter(p=>(priorityFilter==="all"||p.priority===priorityFilter)&&
  (!ownerSearch||p.ownerId?.toLowerCase().includes(ownerSearch.toLowerCase())||
    p.obligationId.toLowerCase().includes(ownerSearch.toLowerCase())));
 const outstanding=plan.filter(p=>p.state!=="approved");
 const overdue=plan.filter(p=>p.dueDate&&today&&p.dueDate<today&&p.state!=="approved").length;
 return <section className="section-block panel" aria-label="Panel zarządczy Compliance Guardian">
  <div className="panel-top"><h2>Compliance Management Dashboard</h2><span className="pill">DEMO · DANE LOKALNE</span></div>
  <p className="muted">Wskaźniki wynikają tylko z odpowiedzi w diagnostyce powyżej. Nie są audytem prawnym ani rzeczywistym raportem organizacji. Przydziały są demonstracyjne, nie są zapisywane ani wysyłane do serwera.</p>
  <div className="kpi-grid">
   <div className="kpi"><span>Sprawy do rozpatrzenia</span><strong>{outstanding.length}</strong><small>Brak zatwierdzeń prawnych</small></div>
   <div className="kpi"><span>Priorytet wysoki</span><strong>{outstanding.filter(p=>p.priority==="high").length}</strong><small>Wstępne braki dowodowe</small></div>
   <div className="kpi"><span>Nieprzydzielone</span><strong>{outstanding.filter(p=>!p.ownerId).length}</strong><small>Wymagają wskazania właściciela</small></div>
   <div className="kpi"><span>Po terminie</span><strong>{today?overdue:"—"}</strong><small>Po ustawieniu daty referencyjnej</small></div>
  </div>
  <div className="notice compact">
   <label htmlFor="comp-filter">Priorytet: </label>
   <select id="comp-filter" value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}>
    <option value="all">Wszystkie</option><option value="high">Wysoki</option><option value="medium">Średni</option><option value="normal">Standardowy</option>
   </select>
   <label htmlFor="comp-owner"> Szukaj po zadaniu/właścicielu: </label>
   <input id="comp-owner" value={ownerSearch} maxLength={70} onChange={e=>setOwnerSearch(e.target.value)} />
   <label htmlFor="comp-today"> Data referencyjna: </label>
   <input id="comp-today" type="date" value={today} onChange={e=>setToday(e.target.value)} />
  </div>
  <div className="agent-list">
   {visible.length===0?<p>Brak zadań dla wskazanych filtrów.</p>:visible.map((action:RemediationAction)=>{
    const initial=assignments[action.obligationId];
    const item=findings.find(f=>f.obligationId===action.obligationId);
    return <article className="model-card" key={action.id}>
     <h3>{item?.article??action.obligationId} · {priorityName[action.priority]}</h3>
     <p><strong>Stan:</strong> {stateName[action.state]} · <strong>Rodzaj:</strong> {action.description}</p>
     <p><strong>Powód:</strong> {item?.reason}</p>
     <p><strong>Brakujące dowody:</strong> {item?.missingEvidence.join(", ")||"Brak wskazanych — wymagana kontrola jakości"}</p>
     <label htmlFor={"owner-"+action.id}>Właściciel zadania (identyfikator DEMO): </label>
     <input id={"owner-"+action.id} value={initial?.ownerId??""} maxLength={80} placeholder="np. dzial-prawny"
      onChange={e=>setAssignments(current=>({...current,[action.obligationId]:{ownerId:e.target.value,dueDate:current[action.obligationId]?.dueDate??""}}))}/>
     <label htmlFor={"due-"+action.id}> Termin: </label>
     <input id={"due-"+action.id} type="date" value={initial?.dueDate??""}
      onChange={e=>setAssignments(current=>({...current,[action.obligationId]:{ownerId:current[action.obligationId]?.ownerId??"",dueDate:e.target.value}}))}/>
     {initial&&action.state==="proposed"&&initial.ownerId&&initial.dueDate&&
       <p role="status">Nieprawidłowy właściciel lub data zadania.</p>}
     {errors[action.obligationId]&&<p role="status">{errors[action.obligationId]}</p>}
     <p><a href={action.sourceUrl} target="_blank" rel="noopener noreferrer">Podstawa prawna · EUR-Lex</a></p>
     <small>Nie ustalono naruszenia prawa. Dalsze zmiany stanu wymagają autoryzowanego przepływu z recenzentem; panel demonstracyjny ich nie zatwierdza.</small>
    </article>;
   })}
  </div>
  <button type="button" onClick={()=>{setAssignments({});setPriorityFilter("all");setOwnerSearch("");setToday("");setErrors({});}}>Wyczyść demonstracyjny plan</button>
 </section>;
}
