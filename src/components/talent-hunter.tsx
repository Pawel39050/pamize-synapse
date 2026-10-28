"use client";

import {useEffect,useMemo,useState} from "react";
import type {HunterCategory,HunterDecision,HunterInput,HunterResult} from "../lib/talent-hunter";

const STORAGE="pamize.talent-hunter.v1.records";
const TABS=[
  {id:"radar",label:"Radar ofert"},
  {id:"analizy",label:"Analizy stanowisk"},
  {id:"ranking",label:"Ranking możliwości"},
  {id:"leady",label:"Leady PAMIZE"},
  {id:"historia",label:"Historia i ustawienia"}
] as const;
type Tab=typeof TABS[number]["id"];
const START:HunterInput={title:"",company:"",location:"",sourceUrl:"",category:"pzp",text:""};
const money=(amount:number)=>new Intl.NumberFormat("pl-PL",{style:"currency",currency:"PLN",maximumFractionDigits:0}).format(amount);
const date=(d:string)=>new Date(d).toLocaleString("pl-PL",{dateStyle:"short",timeStyle:"short"});
const tag=(x:HunterResult)=>x.classification==="silny lead"?"th-tag-green":x.classification==="niski priorytet"?"th-tag-gray":"th-tag-amber";

export function TalentHunter(){
  const [tab,setTab]=useState<Tab>("radar");
  const [form,setForm]=useState<HunterInput>(START);
  const [records,setRecords]=useState<HunterResult[]>([]);
  const [selected,setSelected]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [aiConfigured,setAiConfigured]=useState(false);
  const [statusReady,setStatusReady]=useState(false);
  const [filter,setFilter]=useState("");
  const [decisionNote,setDecisionNote]=useState("");
  const [storageMode,setStorageMode]=useState<"checking"|"local"|"postgres"|"connect"|"error">("checking");
  const [localBackup,setLocalBackup]=useState<HunterResult[]>([]);

  useEffect(()=>{
    try{
      const saved=window.localStorage.getItem(STORAGE);
      if(saved){const parsed:unknown=JSON.parse(saved);if(Array.isArray(parsed)){
        const prior=parsed.slice(0,100) as HunterResult[];setRecords(prior);setLocalBackup(prior);
      }}
    }catch{/* unavailable or corrupt browser storage */}
    fetch("/api/talent-hunter/analyze",{cache:"no-store"}).then(r=>r.json()).then(x=>{
      setAiConfigured(Boolean(x.modelConfigured));setStatusReady(true);
    }).catch(()=>setStatusReady(true));
    fetch("/api/microsoft/talent-hunter/records",{cache:"no-store"}).then(async r=>{
      if(r.status===401){setStorageMode("connect");return;}
      if(!r.ok){setStorageMode("error");return;}
      const x=await r.json() as {configured:boolean;records:HunterResult[]};
      if(x.configured){
        setRecords(x.records);
        const ids=new Set(x.records.map(item=>item.id));
        setLocalBackup(prev=>prev.filter(item=>!ids.has(item.id)));
        setStorageMode("postgres");
      }
      else setStorageMode("local");
    }).catch(()=>setStorageMode("error"));
  },[]);
  const choose=(r:HunterResult)=>{setSelected(r.id);setDecisionNote(r.decisionNote);setTab("analizy");};
  const save=(list:HunterResult[])=>{
    const next=list.slice(0,100);setRecords(next);
    // Browser cache is retained as a recovery copy until migration is verified.
    try{
      const previous:unknown=JSON.parse(window.localStorage.getItem(STORAGE)??"[]");
      const old=Array.isArray(previous)?previous as HunterResult[]:[];
      const keep=old.filter(item=>!next.some(x=>x.id===item.id));
      window.localStorage.setItem(STORAGE,JSON.stringify([...next,...keep].slice(0,100)));
    }catch{setNotice("Przeglądarka nie zapisuje historii. Zachowaj wynik analizy osobno.");}
  };
  async function importLocal(){
    setBusy(true);setError("");setNotice("");
    try{
      for(let offset=0;offset<localBackup.length;offset+=20){
        const r=await fetch("/api/microsoft/talent-hunter/records",{
          method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({records:localBackup.slice(offset,offset+20)})
        });
        const x=await r.json() as {error?:string};
        if(!r.ok)throw Error(x.error??"Import nie powiódł się.");
      }
      const r=await fetch("/api/microsoft/talent-hunter/records",{cache:"no-store"});
      if(!r.ok)throw Error("Nie udało się odczytać danych po imporcie.");
      const x=await r.json() as {records:HunterResult[]};
      setRecords(x.records);setLocalBackup([]);setStorageMode("postgres");
      setNotice("Historia została przeniesiona do PostgreSQL. Lokalną kopię pozostawiono na wszelki wypadek.");
    }catch(e){setError(e instanceof Error?e.message:"Błąd importu");}
    finally{setBusy(false);}
  }
  const current=records.find(r=>r.id===selected)??records[0]??null;
  const approved=records.filter(r=>r.decision==="zatwierdzone");
  const ranked=useMemo(()=>[...records].filter(x=>(x.company+" "+x.title).toLocaleLowerCase("pl-PL").includes(filter.toLocaleLowerCase("pl-PL"))).sort((a,b)=>b.score-a.score),[records,filter]);
  const update=(k:keyof HunterInput,v:string)=>setForm(s=>({...s,[k]:v}));
  async function analyze(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError("");setNotice("");
    try{
      const res=await fetch("/api/microsoft/talent-hunter/analyze",{method:"POST",
        headers:{"Content-Type":"application/json"},body:JSON.stringify(form),cache:"no-store"});
      const payload=await res.json() as {error?:string;result?:HunterResult;aiConfigured?:boolean;persisted?:boolean;storageWarning?:string};
      if(!res.ok||!payload.result)throw Error(payload.error??"Analiza nie powiodła się.");
      const job=payload.result;
      const duplicate=records.find(x=>x.sourceUrl&&job.sourceUrl&&x.sourceUrl===job.sourceUrl);
      if(duplicate){setNotice("Znaleziono wcześniejszą analizę tego URL — nową zapisano jako osobną wersję. Porównaj wyniki w Historii.");}
      save([job,...records]);setSelected(job.id);setDecisionNote("");setTab("analizy");
      if(payload.persisted){setStorageMode("postgres");}
      else if(payload.storageWarning)setNotice(payload.storageWarning);
      else setNotice("Zapis lokalny — podłącz bazę PostgreSQL, aby historia była dostępna na innych urządzeniach.");
    }catch(err){setError(err instanceof Error?err.message:"Nie udało się wykonać analizy.");}
    finally{setBusy(false);}
  }
  async function decide(decision:HunterDecision){
    if(!current)return;
    setBusy(true);setError("");
    try{
      if(storageMode==="postgres"){
        const response=await fetch("/api/microsoft/talent-hunter/records",{
          method:"PATCH",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({id:current.id,decision,decisionNote:decisionNote.slice(0,500)})
        });
        const json=await response.json() as {error?:string};
        if(!response.ok)throw Error(json.error??"Baza nie zapisała decyzji.");
      }
      save(records.map(x=>x.id===current.id?{...x,decision,decisionNote:decisionNote.slice(0,500)}:x));
      setNotice(decision==="zatwierdzone"?"Lead zatwierdzony. Nie wysłano żadnej wiadomości ani oferty.":decision==="odrzucone"?"Analiza odrzucona.":"Przywrócono do przeglądu.");
    }catch(e){setError(e instanceof Error?e.message:"Błąd zapisu decyzji");}
    finally{setBusy(false);}
  }
  const aiLabel=!statusReady?"Sprawdzanie silnika…":aiConfigured?"AI · analiza semantyczna":"Reguły · tryb bez API";
  return <div className="th-shell">
    <div className="th-top">
      <div className="th-brandline"><div className="th-mark">TH</div><div>
        <div className="th-overline">PAMIZE / DIGITAL WORKFORCE</div>
        <h2>Talent Hunter <span>v1.0</span></h2>
        <p>Od ogłoszenia o pracę do kwalifikowanego leada.</p>
      </div></div>
      <div className="th-service">
        <span className={"th-status-dot "+(aiConfigured?"on":"")}></span>
        <strong>{aiLabel}</strong>
        <small>Metodyka 1.0 · Polska · PZP i zakupy</small>
      </div>
    </div>
    <div className="th-tabs" role="tablist" aria-label="Widoki Talent Hunter">
      {TABS.map(x=><button key={x.id} role="tab" aria-selected={tab===x.id} className={tab===x.id?"active":""} onClick={()=>{setTab(x.id);setError("");setNotice("");}}>{x.label}</button>)}
    </div>
    <div className="th-body">
      <div className="th-kpis">
        <div><span>Przeanalizowane oferty</span><strong>{records.length}</strong><small>{storageMode==="postgres"?"Dane z PostgreSQL":"Historia przeglądarki"}</small></div>
        <div><span>Potencjał ≥60%</span><strong>{records.filter(r=>r.potential>=60).length}</strong><small>Hipotezy do weryfikacji</small></div>
        <div><span>Zatwierdzone leady</span><strong>{approved.length}</strong><small>Wyłącznie za Twoją zgodą</small></div>
        <div><span>Pilotaż 30 ogłoszeń</span><strong>{records.length}<em> / 30</em></strong><small>Plan próbny Talent Hunter v1.0</small></div>
      </div>
      {!aiConfigured&&<div className="th-alert"><strong>Tryb ograniczony:</strong> brak serwerowego klucza modelu AI. Możesz już analizować tekst ofert, ale działa uproszczona analiza regułowa, nie agent semantyczny. Wyniki nie są dowodami potencjału automatyzacji.</div>}
      <div className="th-alert th-note">
        <strong>Magazyn danych:</strong> {storageMode==="postgres"?"Połączono z PostgreSQL Neon. Analizy i decyzje są utrwalane na serwerze; przeglądarka zachowuje kopię awaryjną.":
        storageMode==="connect"?"Połącz konto Microsoft właściciela w Knowledge & Academy, aby uruchomić bezpieczne analizy. Aktualne wpisy pozostają w przeglądarce.":
        storageMode==="checking"?"Trwa sprawdzanie bazy i sesji Microsoft…":
        storageMode==="error"?"Baza nie odpowiada lub wymaga migracji SQL. Przeglądarka zachowuje zapisane wyniki; nie uruchamiaj nowego pilotażu do czasu weryfikacji.":"Aktualnie zapis lokalny w przeglądarce. Do wspólnej historii trzeba podłączyć Neon PostgreSQL."}
        {" "}Automatyczny skaner i harmonogram nie są jeszcze aktywne.
        {storageMode==="connect"&&<a className="th-link" href="/knowledge-live">Otwórz logowanie Microsoft →</a>}
        {storageMode==="postgres"&&localBackup.length>0&&<button type="button" className="th-action th-action-outline" disabled={busy} style={{marginLeft:12}} onClick={importLocal}>Zaimportuj {localBackup.length} lokalnych analiz do bazy</button>}
      </div>
      {error&&<div className="th-alert th-error" role="alert">{error}</div>}
      {notice&&<div className="th-alert th-success" role="status">{notice}</div>}
      {tab==="radar"&&<div className="th-columns">
        <section className="th-panel">
          <div className="th-panel-heading"><div><span className="th-kicker">F01–F04 · WPROWADŹ OFERTĘ</span><h3>Nowa analiza stanowiska</h3></div><span className="th-chip">Ręczny import</span></div>
          <form onSubmit={analyze} className="th-form">
            <div className="th-formrow">
              <label>Obszar stanowiska<select value={form.category} onChange={e=>update("category",e.target.value)}><option value="pzp">Zamówienia publiczne / przetargi</option><option value="zakupy">Zakupy / logistyka operacyjna</option></select></label>
              <label>Nazwa stanowiska<input maxLength={140} value={form.title} onChange={e=>update("title",e.target.value)} placeholder="Np. Specjalista ds. zamówień publicznych"/></label>
            </div>
            <div className="th-formrow">
              <label>Pracodawca<input maxLength={140} value={form.company} onChange={e=>update("company",e.target.value)} placeholder="Firma z ogłoszenia"/></label>
              <label>Lokalizacja<input maxLength={140} value={form.location} onChange={e=>update("location",e.target.value)} placeholder="Np. Warszawa / zdalnie"/></label>
            </div>
            <label>Link do ogłoszenia (opcjonalny)<input type="url" value={form.sourceUrl} onChange={e=>update("sourceUrl",e.target.value)} placeholder="https://..." /></label>
            <label>Treść ogłoszenia — obowiązki i wymagania<textarea required minLength={160} maxLength={16000} rows={11} value={form.text} onChange={e=>update("text",e.target.value)} placeholder="Wklej treść rzeczywistego ogłoszenia z sekcją obowiązków. Adres URL jest tylko referencją: w MVP nie pobieramy stron automatycznie."/></label>
            <div className="th-form-foot"><small>{form.text.length.toLocaleString("pl-PL")} / 16 000 znaków</small><button className="th-action" type="submit" disabled={busy||form.text.trim().length<160}>{busy?"Analizuję…":"Przeanalizuj ogłoszenie →"}</button></div>
          </form>
        </section>
        <aside className="th-panel th-explain">
          <span className="th-kicker">PROCES ANALITYCZNY</span><h3>Jak pracuje Talent Hunter?</h3>
          {["Pozyskanie ogłoszenia i kontrola źródła","Rozbicie obowiązków na zadania","Ważona ocena podatności na automatyzację","Scoring i rekomendacja kolejnego kroku","Zatwierdzenie człowieka"].map((x,i)=><div className="th-step" key={x}><b>{String(i+1).padStart(2,"0")}</b><span>{x}</span></div>)}
          <div className="th-explain-bottom"><strong>Próg kwalifikacji: 60%</strong><p>Nie oznacza automatycznie redukcji etatu ani gwarancji oszczędności. Udziały czasu wymagają ustalenia w discovery.</p></div>
        </aside>
      </div>}
      {tab==="analizy"&&(!current?<div className="th-empty"><h3>Nie ma jeszcze żadnej analizy</h3><p>Wklej rzeczywiste ogłoszenie w Radarze, a tutaj zobaczysz rozbicie zadań i scoring.</p><button className="th-action" onClick={()=>setTab("radar")}>Przejdź do Radaru</button></div>:
        <div className="th-columns th-analysis">
          <section className="th-panel">
            <span className="th-kicker">F04–F06 · ANALIZA PRACY</span>
            <div className="th-result-head"><div><h3>{current.title}</h3><p>{current.company}{current.location?" · "+current.location:""}</p></div><span className={"th-label "+tag(current)}>{current.classification}</span></div>
            <div className="th-scoreline"><div><span>Potencjał automatyzacji</span><strong>{current.potential}%</strong></div><div><span>Scoring możliwości</span><strong>{current.score}<small> / 100</small></strong></div><div><span>Jakość danych</span><strong>{current.quality}%</strong></div></div>
            <div className="th-panel-heading"><h3>Analiza obowiązków</h3><small>Wagi czasu = 100% · szacunki do weryfikacji</small></div>
            <div className="th-tablewrap"><table className="th-table"><thead><tr><th>Zadanie i źródło</th><th>Udział czasu</th><th>Automatyzacja</th></tr></thead><tbody>
              {current.tasks.map((t,i)=><tr key={i}><td><strong>{t.name}</strong><small>„{t.evidence}”</small><small>Pewność: {t.confidence}</small></td><td>{t.share}%</td><td><strong>{t.automatable}%</strong><div className="th-meter"><i style={{width:t.automatable+"%"}}/></div></td></tr>)}
            </tbody></table></div>
            <div className="th-caution">{current.caveat}</div>
            {current.sourceUrl&&<a className="th-link" href={current.sourceUrl} rel="noreferrer noopener" target="_blank">Otwórz oryginalne ogłoszenie ↗</a>}
          </section>
          <aside className="th-panel">
            <span className="th-kicker">F07–F08 · KARTA LEADA</span><h3>Rekomendacja PAMIZE</h3>
            <p className="th-recommendation">{current.recommendation}</p>
            <div className="th-fact"><span>Wynagrodzenie z ogłoszenia</span><strong>{current.salary}</strong></div>
            <div className="th-fact"><span>Scenariusz PAMIZE</span><strong>{money(4000)} / miesiąc + wdrożenie</strong><small>Oferta i potencjalna korzyść dopiero po discovery.</small></div>
            <div className="th-fact"><span>Silnik analizy</span><strong>{current.engine==="ai"?"Model AI: "+current.model:"Reguły (bez modelu AI)"}</strong><small>Tokeny: {current.tokenUsage??"n/d"} · Metodyka {current.methodology}</small></div>
            <h4>Ograniczenia i ryzyka</h4><ul className="th-risks">{current.risks.map((x,i)=><li key={i}>{x}</li>)}</ul>
            <label className="th-decision">Notatka do decyzji<textarea rows={3} value={decisionNote} onChange={e=>setDecisionNote(e.target.value)} maxLength={500} placeholder="Uzasadnienie akceptacji lub odrzucenia…"/></label>
            <div className="th-decisions"><button className="th-action" disabled={busy} onClick={()=>void decide("zatwierdzone")}>✓ Zatwierdź lead</button><button className="th-action th-action-outline" disabled={busy} onClick={()=>void decide("odrzucone")}>Odrzuć</button></div>
            <span className="th-footnote">Decyzja zapisuje się {storageMode==="postgres"?"w PostgreSQL":"w tej przeglądarce"}. Nie wysyła kontaktu do firmy.</span>
          </aside>
        </div>
      )}
      {tab==="ranking"&&<section className="th-panel"><div className="th-panel-heading"><div><span className="th-kicker">F05 · RANKING</span><h3>Możliwości automatyzacji</h3></div><input className="th-filter" placeholder="Szukaj firmy lub stanowiska…" value={filter} onChange={e=>setFilter(e.target.value)}/></div>
        {ranked.length?<div className="th-tablewrap"><table className="th-table"><thead><tr><th>Firma / stanowisko</th><th>Automatyzacja</th><th>Scoring</th><th>Klasyfikacja</th><th></th></tr></thead><tbody>
          {ranked.map(r=><tr key={r.id}><td><strong>{r.company}</strong><small>{r.title}</small></td><td>{r.potential}%</td><td>{r.score}/100</td><td><span className={"th-label "+tag(r)}>{r.classification}</span></td><td><button className="th-ghost" onClick={()=>choose(r)}>Otwórz →</button></td></tr>)}
        </tbody></table></div>:<p className="th-muted">Brak przeanalizowanych ofert.</p>}
      </section>}
      {tab==="leady"&&<section className="th-panel"><div className="th-panel-heading"><div><span className="th-kicker">F07 · REJESTR LEADÓW</span><h3>Zatwierdzone możliwości</h3></div><span className="th-chip">{approved.length} rekordów</span></div>
        {approved.length?<div className="th-leadgrid">{approved.map(x=><div className="th-lead" key={x.id}><span className="th-label th-tag-green">Zatwierdzony</span><h4>{x.company}</h4><p>{x.title}</p><div><b>{x.potential}%</b> potencjału · wynik {x.score}/100</div><button className="th-ghost" onClick={()=>choose(x)}>Zobacz analizę →</button></div>)}</div>:
          <div className="th-empty"><h3>Jeszcze nie zatwierdzono leadów</h3><p>Po analizie ogłoszenia możesz zaakceptować lead. Integracja z CRM będzie kolejnym etapem.</p></div>}
      </section>}
      {tab==="historia"&&<div className="th-columns">
        <section className="th-panel"><div className="th-panel-heading"><div><span className="th-kicker">REJESTR</span><h3>Historia analiz i decyzji</h3></div><span className="th-chip">{records.length} wpisów</span></div>
          {records.length?<div className="th-history">{records.map(x=><button key={x.id} onClick={()=>choose(x)}><span><strong>{x.company} · {x.title}</strong><small>{date(x.createdAt)} · {x.engine==="ai"?"AI":"Reguły"} · {x.decision}</small></span><b>{x.potential}% →</b></button>)}</div>:<p className="th-muted">Brak historii. Wykonaj pierwszą analizę w Radarze.</p>}
        </section>
        <aside className="th-panel"><span className="th-kicker">USTAWIENIA MVP</span><h3>Kontrola zakresu</h3>
          <div className="th-fact"><span>Metodyka</span><strong>Talent Hunter v1.0</strong></div>
          <div className="th-fact"><span>Obszary</span><strong>PZP · Zakupy i logistyka</strong></div>
          <div className="th-fact"><span>Próg kwalifikacji</span><strong>60%</strong></div>
          <div className="th-fact"><span>Automatyczny skaner portali</span><strong>Nieaktywny</strong></div>
          <div className="th-fact"><span>CRM i magazyn danych</span><strong>{storageMode==="postgres"?"PostgreSQL połączony; CRM planowany":"PostgreSQL do aktywacji; CRM planowany"}</strong></div>
          <div className="th-fact"><span>Wysyłanie wiadomości</span><strong>Wyłączone</strong></div>
          <p className="th-footnote">API odczytu i zapisu wymaga sesji Microsoft właściciela. Docelowa obsługa klientów i ról wymaga dodatkowych uprawnień.</p>
        </aside>
      </div>}
    </div>
  </div>;
}
