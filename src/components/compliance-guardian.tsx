import Link from "next/link";
import { initialAgents } from "../lib/catalog";

const capabilities = [
  {title:"AI Act Assessment",description:"Kwalifikacja przeznaczenia systemu, ról i potencjalnych obowiązków."},
  {title:"GDPR Assessment",description:"Podstawy przetwarzania, kategorie danych, DPIA i role administratora."},
  {title:"Regulatory Intelligence",description:"Rejestr źródeł urzędowych i zmian prawnych — integracja planowana."},
  {title:"Regulatory Impact Analysis",description:"Mapowanie zmian przepisów na agentów, procedury i terminy — integracja planowana."}
];

export function ComplianceGuardian() {
  const guardian = initialAgents.find((item) => item.key === "AG-GOV-001");
  return (
    <>
      <section className="notice compact" role="status">
        <strong>Wersja demonstracyjna.</strong> Moduł nie monitoruje jeszcze przepisów, nie ocenia zgodności prawnej i nie blokuje operacji. Dane poniżej pochodzą z projektowego katalogu Synapse.
      </section>
      <div className="kpi-grid">
        <div className="kpi"><span>Definicje agentów w katalogu</span><strong>{initialAgents.length}</strong><small>Nie oznacza aktywnych wdrożeń</small></div>
        <div className="kpi"><span>Oceny prawne wykonane</span><strong>0</strong><small>Brak podłączonego silnika analiz</small></div>
        <div className="kpi"><span>Źródła regulacyjne online</span><strong>0</strong><small>Monitoring jeszcze nieuruchomiony</small></div>
        <div className="kpi"><span>Analizy wpływu regulacji</span><strong>0</strong><small>Funkcja planowana</small></div>
      </div>
      <section className="panel">
        <div className="panel-top"><h2>Karta Compliance Guardian</h2><span className="pill">DEFINICJA 0.1.0</span></div>
        <p className="muted">{guardian?.purpose ?? "Definicja agenta nie jest dostępna."}</p>
        <div className="info-split">
          <div><span className="field-label">Identyfikator</span><strong>{guardian?.key ?? "Brak"}</strong></div>
          <div><span className="field-label">Stan operacyjny</span><strong>Nieuruchomiony</strong></div>
        </div>
        <h3>Zaplanowane kompetencje</h3>
        <div className="tag-row">{guardian?.skillKeys.map((skill) => <span className="small-chip" key={skill}>{skill}</span>)}</div>
      </section>
      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">PLAN FUNKCJONALNY</span><h2>Cztery obszary MVP</h2></div></div>
        <div className="model-grid">
          {capabilities.map((item) => <div className="model-card" key={item.title}><h3>{item.title}</h3><p>{item.description}</p><span className="tiny-tag">Do wdrożenia</span></div>)}
        </div>
      </section>
      <section className="panel">
        <div className="panel-top"><h2>Powiązanie z rejestrem cyfrowych pracowników</h2><span className="tiny-tag">{initialAgents.length} definicji</span></div>
        <p className="muted">Lista definicji dostępnych w katalogu projektowym. Oceny zgodności, przypisania do klientów i historia audytu nie zostały jeszcze utworzone.</p>
        <div className="agent-list">
          {initialAgents.map((agent) => <div className="agent-item" key={agent.key}>
            <span className="agent-monogram">{agent.family === "Governance" ? "GV" : "AI"}</span>
            <span><strong>{agent.name}</strong><small>{agent.key} · {agent.lifecycle} · ocena: nieprzeprowadzona</small></span>
          </div>)}
        </div>
        <p style={{marginTop:20}}><Link href="/modules/agent-registry" className="text-link">Przejdź do Agent Registry →</Link></p>
      </section>
      <section className="section-block panel">
        <div className="panel-top"><h2>Regulatory Impact Analysis</h2><span className="pill">PLANOWANE</span></div>
        <p className="muted">Docelowy raport: przepis i data stosowania → agenci i klienci objęci zmianą → wymagane działania → właściciel i termin → dowody zamknięcia. Brak fikcyjnych alertów lub terminów.</p>
      </section>
    </>
  );
}
