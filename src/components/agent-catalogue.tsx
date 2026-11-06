"use client";

import { useMemo, useState } from "react";
import { initialAgents } from "../lib/catalog";

export function AgentCatalogue() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(initialAgents[0].key);
  const filtered = useMemo(() => initialAgents.filter((item) => (
    (item.name + " " + item.key + " " + item.family).toLowerCase().includes(search.toLowerCase())
  )), [search]);
  const active = initialAgents.find((item) => item.key === selected) ?? initialAgents[0];

  return (
    <div className="registry-grid">
      <section className="panel">
        <div className="panel-top"><h2>Definicje agentów</h2><span className="tiny-tag">{initialAgents.length} wpisów</span></div>
        <label className="input-label" htmlFor="agent-search">Szukaj agenta</label>
        <input id="agent-search" className="search-input" type="search" placeholder="Nazwa, ID lub rodzina" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="agent-list">
          {filtered.map((item) => (
            <button type="button" key={item.key} className={"agent-item" + (active.key===item.key ? " selected":"")} onClick={() => setSelected(item.key)}>
              <span className="agent-monogram">{item.family === "Finance" ? "FI" : item.family === "Organization" ? "OR" : item.family === "Strategic" ? "ST" : "SYS"}</span>
              <span><strong>{item.name}</strong><small>{item.key} · {item.family}</small></span>
              <span className="agent-arrow">›</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="empty">Brak pasujących definicji.</p>}
        </div>
      </section>
      <section className="panel agent-detail">
        <div className="panel-top"><h2>Karta cyfrowego pracownika</h2><span className="pill">PLANOWANY</span></div>
        <span className="eyebrow">{active.key} · WERSJA {active.version}</span>
        <h3>{active.name}</h3>
        <p>{active.purpose}</p>
        <div className="info-split"><div><span className="field-label">Rodzina</span><strong>{active.family}</strong></div><div><span className="field-label">Status</span><strong>Nieuruchomiony</strong></div></div>
        <h4>Kompetencje (Skills)</h4>
        <div className="tag-row">{active.skillKeys.map((s) => <span key={s} className="small-chip">{s}</span>)}</div>
        <h4>Narzędzia (planowane)</h4>
        <div className="tag-row">{active.toolKeys.length ? active.toolKeys.map((s) => <span key={s} className="small-chip">{s}</span>) : <span className="helper">Nie wymaga dostępu do zewnętrznych narzędzi.</span>}</div>
        <div className="notice compact">Ten katalog to dokumentacja definicji. Nie tworzy instancji agenta, nie uruchamia modeli i nie nadaje rzeczywistych uprawnień.</div>
      </section>
    </div>
  );
}
