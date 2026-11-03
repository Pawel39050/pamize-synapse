"use client";
import {useState} from "react";
import {parseLocalProcurementEvents,type LocalEventReview,MAX_LOCAL_EVENT_BYTES} from "../lib/compliance/procurement-event-local-import";
import {procurementEventNames,PROCUREMENT_EVENT_SCENARIOS} from "../lib/compliance/procurement-event-audit";
const example=JSON.stringify({schemaVersion:"1",agentKey:"AG-PRC-001",events:PROCUREMENT_EVENT_SCENARIOS[0].events},null,2);
export function ProcurementEventLocalImport(){
 const [source,setSource]=useState("");
 const [result,setResult]=useState<LocalEventReview|null>(null);
 const [problem,setProblem]=useState("");
 const analyze=()=>{
  setProblem("");setResult(null);
  try{setResult(parseLocalProcurementEvents(source))}
  catch{setProblem("Niepoprawny format, przekroczony limit lub niedozwolone dane. Wklej wyłącznie syntetyczny dziennik zgodny ze schematem i bez informacji o klientach.");}
 };
 return <section className="section-block panel" aria-label="Lokalny import dziennika działań agenta">
  <div className="panel-top"><h2>Import dziennika agenta · bez połączenia z serwerem</h2><span className="pill">WYŁĄCZNIE DANE TESTOWE</span></div>
  <p className="muted">Możesz wprowadzić dziennik w formacie JSON (maks. 32 KB, 100 zdarzeń) dla demonstracyjnego agenta AG-PRC-001. Analiza wykonywana jest lokalnie w przeglądarce; nie ma wysyłki, zapisu do Neon ani weryfikacji pochodzenia. Nie wklejaj danych klientów, pracowników, nazw prawdziwych dostawców, tokenów ani poufnych dokumentów.</p>
  <label htmlFor="local-event-payload"><strong>JSON zdarzeń (schemaVersion 1)</strong></label>
  <textarea id="local-event-payload" rows={8} maxLength={MAX_LOCAL_EVENT_BYTES} value={source}
   onChange={e=>{setSource(e.target.value);setResult(null);setProblem("");}}
   placeholder='{"schemaVersion":"1","agentKey":"AG-PRC-001","events":[...]}' style={{display:"block",width:"100%",margin:"10px 0"}}/>
  <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:16}}>
   <button type="button" onClick={()=>{setSource(example);setResult(null);setProblem("");}}>Wstaw przykładowy dziennik</button>
   <button type="button" onClick={analyze}>Sprawdź dziennik</button>
   <button type="button" onClick={()=>{setSource("");setResult(null);setProblem("");}}>Wyczyść</button>
  </div>
  {problem&&<p role="alert">{problem}</p>}
  {result&&<div className="notice compact" role="status">
   <h3>Analiza lokalna · {result.audit.status==="blocked"?"Rekomendowane wstrzymanie":"Wymaga przeglądu"}</h3>
   <p><strong>Przebieg:</strong> {result.audit.runId} · <strong>Liczba zdarzeń:</strong> {result.events.length} · <strong>Źródło:</strong> niezweryfikowane</p>
   <div className="agent-list">{result.events.map(e=><article className="model-card" key={e.id}>
    <h4>{e.sequence} · {procurementEventNames[e.kind]}</h4>
    <p>Wykonawca: {e.actorId} · Referencja do dowodu: {e.evidenceRef??"BRAK"}</p>
   </article>)}</div>
   <h4>Ustalenia kontrolne</h4>
   <div className="agent-list">{result.audit.findings.map((f,i)=><article className="model-card" key={f.code+"-"+i}>
    <strong>{f.code}</strong><p>{f.message}</p>
   </article>)}</div>
   <p className="muted"><strong>Ograniczenie:</strong> referencje do dowodów nie oznaczają, że dowody istnieją; deklarowany wykonawca nie jest uwierzytelniony. Żaden import nie potwierdza poprawności działania produkcyjnego agenta.</p>
  </div>}
 </section>;
}
