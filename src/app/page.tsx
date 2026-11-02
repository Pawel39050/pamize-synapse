import Link from "next/link";
import { initialAgents, modules } from "../lib/catalog";

const highlights = [
  {title:"Knowledge & Academy",detail:"18 rzeczywistych dokumentów PAMIZE, sześć kategorii i szybkie otwieranie plików OneDrive.",slug:"skills-knowledge",tag:"Katalog aktywny"},
  {title:"Agent Registry",detail:"Wersjonowane definicje cyfrowych pracowników i umiejętności.",slug:"agent-registry",tag:"Katalog ról"},
  {title:"Agent Orchestrator",detail:"Demonstracja etapów delegowania i zatwierdzania zadań.",slug:"agent-orchestrator",tag:"Symulator"},
  {title:"Compliance Guardian",detail:"Diagnostyka RODO i AI Act oraz wspólny dashboard spraw, priorytetów i działań naprawczych.",slug:"compliance-guardian",tag:"Demo · bez zapisu"}
];

export default function DashboardPage() {
  return (
    <div className="content-wrap">
      <section className="hero">
        <div className="eyebrow">PANEL ZARZĄDCZY · WERSJA 0.1</div>
        <h1>Synapse. Inteligencja operacyjna przedsiębiorstwa.</h1>
        <p>Jedno miejsce do planowania, rozwijania i nadzorowania cyfrowych pracowników PAMIZE. W tej wersji dostępne są struktura 18 modułów oraz demonstracyjne widoki fundamentów systemu.</p>
        <div className="hero-actions">
          <Link className="btn primary" href="/modules/skills-knowledge">Otwórz bibliotekę wiedzy ↗</Link>
          <Link className="btn secondary" href="/modules/agent-orchestrator">Zobacz workflow</Link>
        </div>
      </section>
      <div className="notice"><strong>Ważne:</strong> brak podłączonych przedsiębiorstw, systemów ERP i modeli AI. Wszystkie dane w panelu mają charakter projektowy. Nie są wykonywane operacje na rzeczywistych systemach.</div>
      <section className="kpi-grid" aria-label="Stan projektu">
        <div className="kpi"><span>Planowane moduły</span><strong>{modules.length}</strong><small>Pełna nawigacja panelu</small></div>
        <div className="kpi"><span>Definicje w katalogu</span><strong>{initialAgents.length}</strong><small>W tym 1 silnik deterministyczny</small></div>
        <div className="kpi"><span>Podłączeni klienci</span><strong>0</strong><small>Nie podłączono produkcji</small></div>
        <div className="kpi"><span>Uruchomieni agenci</span><strong>0</strong><small>Wymaga runtime i API</small></div>
      </section>
      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">FUNDAMENT SYSTEMU</span><h2>Dostępne moduły i prototypy</h2></div></div>
        <div className="feature-grid">
          {highlights.map((item,index) => (
            <Link href={`/modules/${item.slug}`} key={item.slug} className="feature-card">
              <div className="feature-icon">{String(index+1).padStart(2,"0")}</div>
              <span className="pill">{item.tag}</span>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
              <span className="feature-link">Otwórz moduł →</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">MAPA ROZWOJU</span><h2>Zakres najbliższych prac</h2></div></div>
        <div className="roadmap">
          <div><span className="step-num">01</span><strong>Model danych i import</strong><p>Tenant isolation, schemat bazy, dane źródłowe, walidacja.</p></div>
          <div><span className="step-num">02</span><strong>Rejestr i uprawnienia</strong><p>Wersje agentów, narzędzia, kontrola dostępu.</p></div>
          <div><span className="step-num">03</span><strong>Orkiestracja</strong><p>Trwałe zadania, bramki akceptacji, audyt.</p></div>
          <div><span className="step-num">04</span><strong>Pilotaż diagnostyczny</strong><p>Rentowność klientów i kapitał obrotowy.</p></div>
        </div>
      </section>
    </div>
  );
}
