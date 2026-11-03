"use client";
import {useMemo,useState} from "react";
import {auditProcurementEvents,procurementEventNames,PROCUREMENT_EVENT_SCENARIOS} from "../lib/compliance/procurement-event-audit";
export function ProcurementEventAudit(){
 const [id,setId]=useState("RUN-001");
 const scenario=PROCUREMENT_EVENT_SCENARIOS.find(x=>x.id===id)!;
 const result=useMemo(()=>auditProcurementEvents(scenario.events),[scenario]);
 return <section className="section-block panel" aria-label="Kontrola dziennika zdarzeń zakupowych">
  <div className="panel-top"><h2>Audit Guardian · kontrola zdarzeń agenta zakupowego</h2><span className="pill">6 SYMULACJI · DOWODY NIEZWERYFIKOWANE</span></div>
  <p className="muted">Analiza sekwencji zdarzeń fikcyjnego cyfrowego pracownika. System sprawdza kolejność czynności, obecność zatwierdzenia, rozdział ról, kompletność referencji dowodowych i spójność logu. Nie pobiera żadnych danych z ERP ani nie potwierdza autentyczności zapisów.</p>
  <label htmlFor="proc-event-scenario"><strong>Wybierz dziennik kontrolny: </strong></label>
  <select id="proc-event-scenario" value={id} onChange={e=>setId(e.target.value)}>{PROCUREMENT_EVENT_SCENARIOS.map(x=><option key={x.id} value={x.id}>{x.id} · {x.title}</option>)}</select>
  <div className="kpi-grid" style={{marginTop:16}}>
   <div className="kpi"><span>Zdarzenia</span><strong>{scenario.events.length}</strong></div>
   <div className="kpi"><span>Wykryte zagadnienia</span><strong>{result.findings.filter(x=>x.code!=="UNVERIFIED_SOURCE").length}</strong></div>
   <div className="kpi"><span>Decyzja testowa</span><strong>{result.status==="blocked"?"WSTRZYMAJ":"PRZEGLĄD"}</strong></div>
  </div>
  <h3>Ścieżka wykonywania procesu</h3>
  <div className="agent-list">{[...scenario.events].sort((a,b)=>a.sequence-b.sequence).map(e=><article className="model-card" key={e.id}>
   <h4>{e.sequence}. {procurementEventNames[e.kind]}</h4>
   <p>Wykonawca: {e.actorId} · Dowód: {e.evidenceRef??"BRAK"}</p>
   <small>{new Date(e.at).toLocaleString("pl-PL",{timeZone:"Europe/Warsaw"})} · identyfikator {e.id}</small>
  </article>)}</div>
  <h3>Wynik niezależnej kontroli</h3>
  <div className="agent-list">{result.findings.map((f,i)=><article className="model-card" key={f.code+"-"+i}>
    <h4>{f.haltRecommended?"Wstrzymanie rekomendowane":f.severity==="review"?"Wymaga weryfikacji źródła":"Wymaga korekty"} · {f.code}</h4>
    <p>{f.message}</p>
  </article>)}</div>
  <p className="muted">Polityka demonstracyjna PROC-EVENT-DEMO-1. Wynik nie jest certyfikatem zgodności ani opinią prawną; każdy scenariusz wymaga przeglądu człowieka. Weryfikacja kryptograficznej integralności i autoryzacji źródeł zostanie wdrożona osobno.</p>
 </section>;
}
