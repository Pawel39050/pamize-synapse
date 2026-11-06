"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {KnowledgeAgent} from './knowledge-agent';
import {knowledgeCategories, knowledgeDocuments, type KnowledgeDocument, type KnowledgeFileKind} from "../lib/knowledge";

type Status = {configured:boolean; connected:boolean; account:string|null};
type SyncResponse = {documents?:KnowledgeDocument[];synchronizedAt?:string;warnings?:string[];error?:string};
const kinds:Array<KnowledgeFileKind|"all">=["all","DOCX","PPTX","PDF","TXT","ZIP","MD","MP4"];

function searchable(text:string) {
  return text.toLocaleLowerCase("pl-PL").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ł/g,"l");
}

export function KnowledgeLibrary(){
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("all");
  const [kind,setKind]=useState<KnowledgeFileKind|"all">("all");
  const [selectedId,setSelectedId]=useState("str-04");
  const [microsoft,setMicrosoft]=useState<Status|null>(null);
  const [liveDocuments,setLiveDocuments]=useState<KnowledgeDocument[]|null>(null);
  const [synchronizing,setSynchronizing]=useState(false);
  const [syncError,setSyncError]=useState("");
  const [syncedAt,setSyncedAt]=useState<string|null>(null);
  const [warnings,setWarnings]=useState<string[]>([]);

  const documents=liveDocuments??knowledgeDocuments;
  const filtered=useMemo(()=>{
    const needle=searchable(query.trim());
    return documents.filter(doc=>{
      const cat=knowledgeCategories.find(c=>c.id===doc.category);
      const body=[doc.name,doc.fileName,doc.summary,...doc.tags,cat?.label??""].join(" ");
      return (category==="all"||doc.category===category)
        && (kind==="all"||doc.kind===kind)
        && (!needle||searchable(body).includes(needle));
    });
  },[documents,query,category,kind]);
  const selected=filtered.find(doc=>doc.id===selectedId)??filtered[0]??null;
  const selectedCategory=knowledgeCategories.find(c=>c.id===selected?.category);
  const reset=()=>{setQuery("");setCategory("all");setKind("all");setSelectedId("str-04");};

  const synchronize=useCallback(async()=>{
    setSynchronizing(true);setSyncError("");
    try{
      const res=await fetch("/api/microsoft/sync",{cache:"no-store",credentials:"same-origin"});
      const data=await res.json() as SyncResponse;
      if(!res.ok||!Array.isArray(data.documents))throw new Error(data.error||"Nie udało się odczytać OneDrive.");
      setLiveDocuments(data.documents);
      setSyncedAt(data.synchronizedAt??new Date().toISOString());
      setWarnings(data.warnings??[]);
    }catch(e){setSyncError(e instanceof Error?e.message:"Błąd Microsoft Graph.");}
    finally{setSynchronizing(false);}
  },[]);

  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        const res=await fetch("/api/microsoft/status",{cache:"no-store",credentials:"same-origin"});
        const data=await res.json() as Status;
        if(!active)return;
        setMicrosoft(data);
        if(data.connected)await synchronize();
      }catch{if(active)setSyncError("Nie można sprawdzić stanu Microsoft OAuth.");}
    })();
    return()=>{active=false;};
  },[synchronize]);

  async function disconnect(){
    setSyncError("");
    try{
      const res=await fetch("/api/microsoft/disconnect",{method:"POST",credentials:"same-origin"});
      if(!res.ok)throw new Error("Błąd rozłączania.");
      setMicrosoft(current=>current?{...current,connected:false,account:null}:current);
      setLiveDocuments(null);setSyncedAt(null);setWarnings([]);
    }catch(e){setSyncError(e instanceof Error?e.message:"Błąd rozłączania.");}
  }

  return <div className="knowledge-root">
    <KnowledgeAgent/>
    <section className="panel microsoft-sync-panel" aria-label="Synchronizacja z Microsoft">
      <div className="microsoft-sync-copy">
        <span className="eyebrow">MICROSOFT GRAPH · TYLKO ODCZYT</span>
        <h2>Synchronizacja OneDrive</h2>
        {microsoft===null?<p>Sprawdzam konfigurację…</p>
          :!microsoft.configured?<p>Połączenie jest przygotowane technicznie. Przed jego uruchomieniem administrator musi zarejestrować aplikację Microsoft i dodać identyfikator oraz sekret do Vercel. Poniżej widzisz zapisany katalog 18 plików.</p>
          :microsoft.connected?<p>Połączono konto {microsoft.account}. {liveDocuments!==null?"Wyświetlane pliki zostały pobrane z Microsoft Graph.":"Widoczny jest katalog zapisany wcześniej — uruchom synchronizację."}</p>
          :<p>Połącz swoje konto Microsoft, aby odczytywać aktualną listę plików w sześciu folderach PAMIZE Synapse. Aplikacja żąda wyłącznie uprawnienia Files.Read.</p>}
        {syncedAt&&<p className="microsoft-last-sync">Ostatni odczyt: {new Date(syncedAt).toLocaleString("pl-PL")}</p>}
        {syncError&&<p className="microsoft-sync-error" role="alert">{syncError}</p>}
        {warnings.length>0&&<p className="microsoft-sync-warning" role="status">{warnings.join(" · ")}</p>}
      </div>
      <div className="microsoft-sync-buttons">
        {microsoft?.configured&&!microsoft.connected&&<a className="btn primary" href="/api/microsoft/connect">Połącz Microsoft ↗</a>}
        {microsoft?.connected&&<>
          <button type="button" className="btn primary" disabled={synchronizing} onClick={synchronize}>{synchronizing?"Pobieranie…":"Synchronizuj teraz ↻"}</button>
          <button type="button" className="btn secondary" disabled={synchronizing} onClick={disconnect}>Rozłącz Microsoft</button>
        </>}
        <span className="microsoft-sync-mode">{liveDocuments!==null?"AKTUALNY ODCZYT Z MICROSOFT GRAPH":"KATALOG ZAPISANY · 28.10.2026"}</span>
      </div>
    </section>

    <section className="knowledge-summary" aria-label="Stan biblioteki">
      <div><span>Pliki w katalogu</span><strong>{documents.length}</strong><small>{liveDocuments!==null?"Odczyt Microsoft Graph":"Stan z 28.10.2026"}</small></div>
      <div><span>Obszary wiedzy</span><strong>{knowledgeCategories.length}</strong><small>Struktura PAMIZE</small></div>
      <div><span>Wyniki wyszukiwania</span><strong>{filtered.length}</strong><small>Z aktualnych filtrów</small></div>
      <div><span>Magazyn</span><strong className="knowledge-source">OneDrive</strong><small>Konto osobiste Microsoft</small></div>
    </section>

    <div className="notice compact"><strong>Źródła i dostęp:</strong> katalog pobiera nazwy, kategorie i odnośniki. Przycisk pobrania bazy odczytuje również treść dokumentów z sześciu folderów PAMIZE Synapse, po sprawdzeniu konta właściciela. Agent RAG przetwarza lokalną kopię na Twoim komputerze. {liveDocuments!==null?"Katalog pochodzi z aktualnego odczytu Microsoft Graph.":"Poniżej widoczny jest zapisany katalog; aktualny odczyt wymaga połączenia Microsoft."}</div>

    <section className="panel knowledge-filter-panel">
      <div className="panel-top"><h2>Przeglądaj firmową wiedzę</h2><span className="pill">{documents.length} PLIKÓW</span></div>
      <div className="knowledge-controls">
        <label className="knowledge-search-label" htmlFor="knowledge-search"><span>Szukaj dokumentów</span><input id="knowledge-search" className="search-input" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Np. Terraform, przetargi, marketing, PZP…" autoComplete="off"/></label>
        <label className="knowledge-type-label" htmlFor="knowledge-format"><span>Format pliku</span><select id="knowledge-format" value={kind} onChange={e=>setKind(e.target.value as KnowledgeFileKind|"all")}>{kinds.map(k=><option key={k} value={k}>{k==="all"?"Wszystkie formaty":k}</option>)}</select></label>
        <button type="button" className="btn secondary knowledge-reset" onClick={reset}>Wyczyść filtry</button>
      </div>
      <div className="knowledge-category-filters" role="group" aria-label="Kategorie dokumentów">
        <button type="button" className={category==="all"?"knowledge-cat active":"knowledge-cat"} aria-pressed={category==="all"} onClick={()=>setCategory("all")}>Wszystkie <span>{documents.length}</span></button>
        {knowledgeCategories.map(c=><button key={c.id} type="button" className={category===c.id?"knowledge-cat active":"knowledge-cat"} aria-pressed={category===c.id} onClick={()=>setCategory(c.id)}>{c.short} <span>{documents.filter(d=>d.category===c.id).length}</span></button>)}
      </div>
    </section>

    <section className="knowledge-browser" aria-label="Dokumenty PAMIZE">
      <div className="panel knowledge-items">
        <div className="panel-top"><h2>Dokumenty <span className="knowledge-count">{filtered.length}</span></h2><span className="knowledge-subtle">Wybierz dokument</span></div>
        {filtered.length===0?<div className="knowledge-empty"><strong>Brak pasujących dokumentów</strong><p>Spróbuj innego hasła lub usuń filtry.</p><button className="btn secondary" type="button" onClick={reset}>Pokaż wszystkie</button></div>
          :<div className="knowledge-items-list">{filtered.map(doc=>{
            const cat=knowledgeCategories.find(c=>c.id===doc.category);
            return <button type="button" key={doc.id} className={selected?.id===doc.id?"knowledge-document active":"knowledge-document"} aria-pressed={selected?.id===doc.id} onClick={()=>setSelectedId(doc.id)}>
              <span className="knowledge-file-icon" aria-hidden="true">{doc.kind==="MP4"?"▶":doc.kind==="ZIP"?"⌘":doc.kind==="PPTX"?"▣":"▤"}</span>
              <span className="knowledge-document-copy"><strong>{doc.name}</strong><small>{cat?.short} · {doc.kind}</small></span>
              <span className="knowledge-document-chevron" aria-hidden="true">›</span>
            </button>;
          })}</div>}
      </div>
      <div className="panel knowledge-detail">
        {selected?<>
          <div className="knowledge-detail-top"><span className="pill">{selected.kind}</span><span className="knowledge-subtle">Katalog PAMIZE</span></div>
          <div className="knowledge-detail-symbol" aria-hidden="true">▤</div>
          <span className="eyebrow">KARTA DOKUMENTU</span>
          <h2>{selected.name}</h2><p className="knowledge-detail-summary">{selected.summary}</p>
          <div className="knowledge-meta">
            <div><span>Kategoria</span><strong>{selectedCategory?.label}</strong></div>
            <div><span>Plik źródłowy</span><strong className="knowledge-filename">{selected.fileName}</strong></div>
            <div><span>Magazyn</span><strong>OneDrive · PAMIZE Synapse</strong></div>
            <div><span>Dostęp</span><strong>Wymagane uprawnienia Microsoft</strong></div>
          </div>
          <div className="knowledge-tags">{selected.tags.map(tag=><span className="small-chip" key={tag}>{tag}</span>)}</div>
          <a className="btn primary knowledge-open" href={selected.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Otwórz w OneDrive ↗</a>
          <p className="knowledge-footnote">Microsoft może poprosić o zalogowanie. Sam odnośnik nie nadaje nowych uprawnień do pliku.</p>
        </>:<p className="empty">Wybierz dokument z listy.</p>}
      </div>
    </section>

    <section className="knowledge-next"><div><span className="eyebrow">KOLEJNY ETAP</span><h2>Wiedza dostępna dla cyfrowych pracowników</h2><p>Lokalny agent wiedzy działa na kopii dokumentów aktualizowanej przez import. Kolejne etapy to automatyczna synchronizacja treści, zatwierdzanie wersji procedur oraz indywidualne uprawnienia agentów i izolacja klientów.</p></div><span className="pill">GRAPH · READ ONLY</span></section>
  </div>;
}
