"use client";
import {useState} from "react";
import {initialAgents} from "../lib/catalog";
import {screenAiActRisk,AI_ACT_OFFICIAL_SOURCE,type AiActScreeningInput,type ScreeningAnswer} from "../lib/compliance/ai-act-risk-screening";
const questions:{key:keyof AiActScreeningInput;label:string;help:string}[]=[
 {key:"prohibitedPractice",label:"Czy planowane zastosowanie może odpowiadać praktykom zakazanym?",help:"Zbadaj m.in. manipulację, niedozwolone wykorzystanie podatności i inne przypadki z art. 5."},
 {key:"annexIIIContext",label:"Czy system będzie używany w obszarach załącznika III?",help:"Np. rekrutacja, zarządzanie zatrudnieniem, edukacja, dostęp do istotnych usług lub inne wymienione zastosowania."},
 {key:"safetyComponent",label:"Czy AI może pełnić funkcję bezpieczeństwa w produkcie regulowanym?",help:"Sprawdź rzeczywiste przeznaczenie systemu, wymogi produktu oraz art. 6 i załącznik I."},
 {key:"directlyInteractsWithPeople",label:"Czy AI bezpośrednio komunikuje się z osobami?",help:"Np. telefon, czat lub głosowy cyfrowy pracownik. Zweryfikuj art. 50."}
];
const empty:AiActScreeningInput={prohibitedPractice:"unknown",annexIIIContext:"unknown",safetyComponent:"unknown",directlyInteractsWithPeople:"unknown"};
const names={ "priority-legal-review":"Pilna ocena prawna", "high-risk-screening":"Wymaga pełnej kwalifikacji wysokiego ryzyka","transparency-review":"Weryfikacja przejrzystości", "classification-incomplete":"Klasyfikacja nieustalona"};
export function AiActRiskScreening(){
 const [answers,setAnswers]=useState<AiActScreeningInput>(empty);
 const [agentKey,setAgentKey]=useState(initialAgents[0]?.key??"");
 const [intendedPurpose,setIntendedPurpose]=useState("");
 const [providerRole,setProviderRole]=useState(false);
 const [deployerRole,setDeployerRole]=useState(false);
 const agent=initialAgents.find(a=>a.key===agentKey);
 const [evaluated,setEvaluated]=useState(false);
 const result=evaluated?screenAiActRisk(answers):null;
 return <section className="section-block panel" aria-label="Wstępna kwalifikacja ryzyka AI Act">
  <div className="panel-top"><h2>Wstępna kwalifikacja ryzyka AI Act</h2><span className="pill">DEMO · PRZESIEW</span></div>
  <p className="muted">Cztery pytania przesiewowe wskazują, które przepisy należy zbadać. Wynik nie przyznaje kategorii „minimalne ryzyko”, nie zwalnia z obowiązków i nie zastępuje kwalifikacji prawnika. Dane nie są wysyłane na serwer.</p>
  <div className="notice compact">
   <label htmlFor="risk-agent"><strong>System z Agent Registry:</strong></label>
   <select id="risk-agent" value={agentKey} onChange={e=>{setAgentKey(e.target.value);setEvaluated(false);}}>
    {initialAgents.map(a=><option key={a.key} value={a.key}>{a.name} ({a.key})</option>)}
   </select>
   <p className="muted">Katalog zawiera definicje demonstracyjne, nie zweryfikowane wdrożenia klientów. Wybór agenta nie przesądza o przeznaczeniu systemu ani jego klasyfikacji prawnej.</p>
   <p><label htmlFor="risk-purpose"><strong>Przeznaczenie i rzeczywiste zastosowanie:</strong></label></p>
   <textarea id="risk-purpose" rows={3} maxLength={600} value={intendedPurpose} placeholder="Np. pomoc w analizie ofert zakupowych, z zatwierdzeniem decyzji przez człowieka" onChange={e=>{setIntendedPurpose(e.target.value);setEvaluated(false);}} style={{width:"100%"}}/>
   <p><strong>Wstępnie deklarowana rola podmiotu:</strong></p>
   <label style={{display:"block"}}><input type="checkbox" checked={providerRole} onChange={e=>{setProviderRole(e.target.checked);setEvaluated(false);}}/> Dostawca AI (provider) – do potwierdzenia</label>
   <label style={{display:"block"}}><input type="checkbox" checked={deployerRole} onChange={e=>{setDeployerRole(e.target.checked);setEvaluated(false);}}/> Podmiot stosujący AI (deployer) – do potwierdzenia</label>
   <p className="muted">Role mogą występować równolegle i zależą od konkretnych działań oraz odpowiedzialności, nie od samej nazwy firmy.</p>
  </div>
  <div className="agent-list">{questions.map(q=><div className="model-card" key={q.key}>
   <label htmlFor={"risk-"+q.key}><strong>{q.label}</strong></label>
   <p className="muted">{q.help}</p>
   <select id={"risk-"+q.key} value={answers[q.key]} onChange={e=>{setAnswers(v=>({...v,[q.key]:e.target.value as ScreeningAnswer}));setEvaluated(false);}}>
    <option value="unknown">Nie ustalono</option>
    <option value="yes">Tak / możliwe</option>
    <option value="no">Nie – według wstępnej deklaracji</option>
   </select>
  </div>)}</div>
  <div style={{display:"flex",gap:12,margin:"16px 0",flexWrap:"wrap"}}>
   <button type="button" onClick={()=>setEvaluated(true)}>Sprawdź ryzyka i obowiązki</button>
   <button type="button" onClick={()=>{setAnswers(empty);setIntendedPurpose("");setProviderRole(false);setDeployerRole(false);setEvaluated(false);}}>Wyczyść</button>
  </div>
  {result&&<div className="notice compact" role="status">
   <h3>{names[result.status]}</h3>
   <p><strong>Agent z rejestru:</strong> {agent?.name??"Brak"} ({agentKey})</p>
   <p><strong>Deklarowane przeznaczenie:</strong> {intendedPurpose.trim()||"Nie opisano – wymaga uzupełnienia"}</p>
   <p><strong>Role podmiotu:</strong> {[providerRole?"dostawca":null,deployerRole?"podmiot stosujący":null].filter(Boolean).join(" i ")||"Nie ustalono"}</p>
   <ul>{result.reasons.map((r,i)=><li key={i}>{r}</li>)}</ul>
   <p><strong>Przepisy do analizy:</strong> {[...new Set(result.references)].join("; ")}.</p>
   <p><strong>Status:</strong> Nie zatwierdzono. Wymagana weryfikacja przeznaczenia, roli dostawcy/podmiotu stosującego oraz aktualnego brzmienia prawa.</p>
  </div>}
  <p><a href={AI_ACT_OFFICIAL_SOURCE} target="_blank" rel="noopener noreferrer" className="text-link">Aktualny tekst AI Act w EUR-Lex →</a></p>
 </section>;
}
