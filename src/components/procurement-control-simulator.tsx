"use client";
import {useMemo,useState} from "react";
import {auditProcurementCase,PROCUREMENT_DEMO_CASES} from "../lib/compliance/procurement-control-audit";
const category={ "policy-control":"Kontrola procedury", "evidence-gap":"Brak dowodu", "legal-review":"Wymaga analizy prawnej"};
const severity={high:"Wysoki",medium:"Średni",review:"Do przeglądu"};
export function ProcurementControlSimulator(){
 const [caseId,setCaseId]=useState(PROCUREMENT_DEMO_CASES[0].id);
 const [all,setAll]=useState(false);
 const scenario=PROCUREMENT_DEMO_CASES.find(c=>c.id===caseId)!;
 const result=useMemo(()=>auditProcurementCase(scenario),[scenario]);
 const summary=useMemo(()=>PROCUREMENT_DEMO_CASES.map(c=>({scenario:c,result:auditProcurementCase(c)})),[]);
 return <section className="section-block panel" aria-label="Symulowany audyt zakupów">
  <div className="panel-top"><h2>Test kontrolny cyfrowego zakupowca</h2><span className="pill">DEMO · 7 TRANSAKCJI</span></div>
  <p className="muted">Deterministyczny test fikcyjnych transakcji według przykładowej procedury PROC-DEMO-1. Nie oznacza weryfikacji rzeczywistego agenta, zgodności z PZP ani stwierdzenia naruszenia prawa. Decyzję podejmuje człowiek.</p>
  <div className="notice compact">
   <label htmlFor="proc-audit-case"><strong>Transakcja testowa: </strong></label>
   <select id="proc-audit-case" value={caseId} onChange={e=>setCaseId(e.target.value)}>{PROCUREMENT_DEMO_CASES.map(c=><option key={c.id} value={c.id}>{c.id} · {c.title}</option>)}</select>
   <p><strong>Wniosek:</strong> {scenario.requestedAmountPln.toLocaleString("pl-PL")} zł · <strong>Budżet:</strong> {scenario.budgetLimitPln.toLocaleString("pl-PL")} zł · <strong>Próg zatwierdzenia:</strong> {scenario.approvalsRequiredAbovePln.toLocaleString("pl-PL")} zł</p>
   <p><strong>Wybrany dostawca:</strong> {scenario.selectedSupplierId} · <strong>Zatwierdzający:</strong> {scenario.approvedBy||"brak"}</p>
   <p><strong>Dokumentacja kryteriów:</strong> {scenario.selectionCriteriaRecorded?"tak":"brak"} · <strong>Ślad audytowy:</strong> {scenario.auditTrailComplete?"kompletny":"niekompletny"}</p>
  </div>
  <div className="agent-list">{scenario.offers.map(o=><div className="model-card" key={o.supplierId}>
   <h4>{o.supplierId} {scenario.selectedSupplierId===o.supplierId?"· WYBRANY":""}</h4>
   <p>Cena {o.pricePln.toLocaleString("pl-PL")} zł · Jakość {o.qualityScore}/100 · Dostawa {o.deliveryDays} dni · Oferta {o.eligible?"kwalifikująca":"niekwalifikująca"}</p>
  </div>)}</div>
  <div className="kpi-grid" style={{marginTop:16}}>
   <div className="kpi"><span>Wykryte zagadnienia</span><strong>{result.findings.length}</strong><small>Według przykładowych reguł</small></div>
   <div className="kpi"><span>Wysoki priorytet</span><strong>{result.findings.filter(f=>f.severity==="high").length}</strong></div>
   <div className="kpi"><span>Wstrzymanie zalecane</span><strong>{result.findings.some(f=>f.haltRecommended)?"TAK":"NIE"}</strong></div>
  </div>
  {result.findings.length===0?<div className="notice compact"><strong>Kontrole demonstracyjne zaliczone.</strong><p>Brak nieprawidłowości według ograniczonego zestawu reguł; nie jest to potwierdzenie pełnej zgodności procesu.</p></div>:
   <div className="agent-list">{result.findings.map(f=><article className="model-card" key={f.code}>
    <h4>{severity[f.severity]} · {category[f.category]} · {f.code}</h4>
    <p>{f.description}</p>
    <p><strong>Działanie:</strong> {f.recommendedAction}</p>
    <small>{f.haltRecommended?"Rekomendowane wstrzymanie decyzji do wyjaśnienia. ":""}Weryfikacja i zatwierdzenie przez człowieka.</small>
   </article>)}</div>}
  <button type="button" onClick={()=>setAll(v=>!v)}>{all?"Ukryj":"Pokaż"} zbiorczy raport 7 testów</button>
  {all&&<div className="agent-list" style={{marginTop:12}}>{summary.map(x=><article className="model-card" key={x.scenario.id}>
   <h4>{x.scenario.id} · {x.scenario.title}</h4>
   <p>{x.result.findings.length===0?"Kontrole demonstracyjne zaliczone":x.result.findings.map(f=>f.code).join(", ")}</p>
  </article>)}</div>}
  <p className="muted">Następny etap: wykonanie tej samej kontroli na zdarzeniach faktycznie wygenerowanych przez agenta zakupowego, z weryfikacją integralności logów, polityki klienta i uprawnień. Obecnie żadna transakcja nie jest wykonywana ani wysyłana.</p>
 </section>;
}
