"use client";

import {useMemo, useState} from "react";
import {knowledgeCategories, knowledgeDocuments, type KnowledgeFileKind} from "../lib/knowledge";

const kinds: Array<KnowledgeFileKind | "all"> = ["all","DOCX","PPTX","ZIP","MD","MP4"];

function searchable(text:string) {
  return text.toLocaleLowerCase("pl-PL").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ł/g,"l");
}

export function KnowledgeLibrary() {
  const [query,setQuery] = useState("");
  const [category,setCategory] = useState("all");
  const [kind,setKind] = useState<KnowledgeFileKind | "all">("all");
  const [selectedId,setSelectedId] = useState<string>("str-04");

  const filtered = useMemo(() => {
    const needle = searchable(query.trim());
    return knowledgeDocuments.filter((doc) => {
      const cat = knowledgeCategories.find((c) => c.id === doc.category);
      const body = [doc.name,doc.fileName,doc.summary,...doc.tags,cat?.label??""].join(" ");
      return (category === "all" || doc.category === category)
        && (kind === "all" || doc.kind === kind)
        && (!needle || searchable(body).includes(needle));
    });
  },[query,category,kind]);

  const selected = filtered.find((doc) => doc.id === selectedId) ?? filtered[0] ?? null;
  const selectedCategory = knowledgeCategories.find((c) => c.id === selected?.category);
  const reset = () => {setQuery("");setCategory("all");setKind("all");setSelectedId("str-04");};

  return (
    <div className="knowledge-root">
      <section className="knowledge-summary" aria-label="Stan biblioteki">
        <div><span>Pliki w katalogu</span><strong>{knowledgeDocuments.length}</strong><small>Potwierdzone w OneDrive</small></div>
        <div><span>Obszary wiedzy</span><strong>{knowledgeCategories.length}</strong><small>Struktura PAMIZE</small></div>
        <div><span>Wyniki wyszukiwania</span><strong>{filtered.length}</strong><small>Z bieżących filtrów</small></div>
        <div><span>Źródło plików</span><strong className="knowledge-source">OneDrive</strong><small>Konto osobiste Microsoft</small></div>
      </section>

      <div className="notice compact"><strong>Ochrona dostępu:</strong> katalog jest dostępny wewnątrz chronionego panelu Vercel. Otwieranie dokumentu odbywa się na stronie Microsoft i podlega uprawnieniom właściciela OneDrive. Nie przechowujemy treści plików, haseł ani tokenów Microsoft w aplikacji. To ręcznie zweryfikowany katalog linków z 28.10.2026, <strong>nie synchronizacja na żywo ani silnik RAG</strong>.</div>

      <section className="panel knowledge-filter-panel">
        <div className="panel-top"><h2>Przeglądaj firmową wiedzę</h2><span className="pill">18 ZWERYFIKOWANYCH PLIKÓW</span></div>
        <div className="knowledge-controls">
          <label className="knowledge-search-label" htmlFor="knowledge-search">
            <span>Szukaj dokumentów</span>
            <input id="knowledge-search" className="search-input" type="search" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Np. Terraform, przetargi, marketing, PZP..." autoComplete="off"/>
          </label>
          <label className="knowledge-type-label" htmlFor="knowledge-format">
            <span>Format pliku</span>
            <select id="knowledge-format" value={kind} onChange={(event)=>setKind(event.target.value as KnowledgeFileKind | "all")}>
              {kinds.map((option)=><option key={option} value={option}>{option === "all" ? "Wszystkie formaty" : option}</option>)}
            </select>
          </label>
          <button className="btn secondary knowledge-reset" type="button" onClick={reset}>Wyczyść filtry</button>
        </div>
        <div className="knowledge-category-filters" role="group" aria-label="Kategorie dokumentów">
          <button type="button" aria-pressed={category==="all"} className={category==="all"?"knowledge-cat active":"knowledge-cat"} onClick={()=>setCategory("all")}>Wszystkie <span>{knowledgeDocuments.length}</span></button>
          {knowledgeCategories.map((c)=>(
            <button key={c.id} type="button" aria-pressed={category===c.id} className={category===c.id?"knowledge-cat active":"knowledge-cat"} onClick={()=>setCategory(c.id)}>
              {c.short} <span>{knowledgeDocuments.filter((d)=>d.category===c.id).length}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="knowledge-browser" aria-label="Katalog i szczegóły dokumentów">
        <div className="panel knowledge-items">
          <div className="panel-top"><h2>Dokumenty <span className="knowledge-count">{filtered.length}</span></h2><span className="knowledge-subtle">Wybierz plik, aby zobaczyć szczegóły</span></div>
          {filtered.length===0 ?
            <div className="knowledge-empty"><strong>Brak pasujących dokumentów</strong><p>Spróbuj innego hasła lub usuń część filtrów.</p><button type="button" className="btn secondary" onClick={reset}>Pokaż wszystkie</button></div> :
            <div className="knowledge-items-list">
              {filtered.map((doc)=>{
                const cat = knowledgeCategories.find((c)=>c.id===doc.category);
                return <button key={doc.id} type="button" onClick={()=>setSelectedId(doc.id)} className={selected?.id===doc.id?"knowledge-document active":"knowledge-document"} aria-pressed={selected?.id===doc.id}>
                  <span className="knowledge-file-icon" aria-hidden="true">{doc.kind==="MP4"?"▶":doc.kind==="ZIP"?"⌘":doc.kind==="PPTX"?"▣":"▤"}</span>
                  <span className="knowledge-document-copy"><strong>{doc.name}</strong><small>{cat?.short} · {doc.kind}</small></span>
                  <span className="knowledge-document-chevron" aria-hidden="true">›</span>
                </button>;
              })}
            </div>}
        </div>
        <div className="panel knowledge-detail">
          {selected ? <>
            <div className="knowledge-detail-top"><span className="pill">{selected.kind}</span><span className="knowledge-subtle">ID {selected.id.toUpperCase()}</span></div>
            <div className="knowledge-detail-symbol" aria-hidden="true">▤</div>
            <span className="eyebrow">KARTA DOKUMENTU</span>
            <h2>{selected.name}</h2>
            <p className="knowledge-detail-summary">{selected.summary}</p>
            <div className="knowledge-meta">
              <div><span>Kategoria</span><strong>{selectedCategory?.label}</strong></div>
              <div><span>Plik źródłowy</span><strong className="knowledge-filename">{selected.fileName}</strong></div>
              <div><span>Magazyn</span><strong>OneDrive · PAMIZE Synapse</strong></div>
              <div><span>Dostęp</span><strong>Wymagane uprawnienia Microsoft</strong></div>
            </div>
            <div className="knowledge-tags">{selected.tags.map((tag)=><span className="small-chip" key={tag}>{tag}</span>)}</div>
            <a className="btn primary knowledge-open" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" href={selected.url}>
              Otwórz w OneDrive <span aria-hidden="true">↗</span>
            </a>
            <p className="knowledge-footnote">Po kliknięciu Microsoft może poprosić o zalogowanie na konto właściciela dokumentu. Link nie nadaje nikomu nowych uprawnień.</p>
          </> : <p className="empty">Wybierz dokument z listy.</p>}
        </div>
      </section>

      <section className="knowledge-next">
        <div><span className="eyebrow">KOLEJNY ETAP</span><h2>Od biblioteki do wiedzy operacyjnej agentów</h2><p>Ten moduł umożliwia już przeglądanie i otwieranie dokumentów. Następna wersja będzie wymagała autoryzacji Microsoft OAuth po stronie serwera, wyszukiwania w treści, wersjonowania i odrębnych praw dostępu dla każdego cyfrowego pracownika.</p></div>
        <span className="pill">INTEGRACJA GRAPH · PLANOWANA</span>
      </section>
    </div>
  );
}
