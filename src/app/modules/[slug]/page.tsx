import Link from "next/link";
import { notFound } from "next/navigation";
import { modules, initialAgents } from "../../../lib/catalog";
import { AgentCatalogue } from "../../../components/agent-catalogue";
import { WorkflowSimulator } from "../../../components/workflow-simulator";
import { KnowledgeLibrary } from "../../../components/knowledge-library";
import { TalentHunter } from "../../../components/talent-hunter";

export function generateStaticParams() {
  return modules.map((module) => ({slug:module.slug}));
}

type PageProps = {params: Promise<{slug:string}>};

function DataModelPreview() {
  const models = [
    {name:"Identyfikacja i organizacja",items:"Tenant · Company · Plant · CostCenter"},
    {name:"Sprzedaż i kontrahenci",items:"Customer · Supplier · Product · SalesInvoiceLine"},
    {name:"Finanse i kapitał obrotowy",items:"CostRecord · Payment · Receivable · Payable"},
    {name:"Produkcja i magazyn",items:"ProductionOrder · Equipment · Downtime · Inventory"},
    {name:"Diagnoza i program zmian",items:"DiagnosticFinding · Evidence · Initiative · Benefit"}
  ];
  return (
    <section className="panel">
      <div className="panel-top"><h2>Universal Data Model – mapa obiektów</h2><span className="pill">SCHEMAT PROJEKTOWY</span></div>
      <p className="muted">Każdy obiekt klienta będzie posiadał identyfikator tenant, powiązania źródłowe i kontrolę jakości danych. Baza produkcyjna nie jest jeszcze utworzona.</p>
      <div className="model-grid">{models.map((model) => <div className="model-card" key={model.name}><h3>{model.name}</h3><p>{model.items}</p></div>)}</div>
      <div className="pipeline" aria-label="Etapy przetwarzania danych">
        {["Źródła ERP / MES","RAW","STAGING","CANONICAL","DIAGNOSTICS"].map((label,i) => (
          <div key={label}><span>{String(i+1).padStart(2,"0")}</span><strong>{label}</strong></div>
        ))}
      </div>
    </section>
  );
}

export default async function ModulePage({params}: PageProps) {
  const {slug} = await params;
  const module = modules.find((item) => item.slug===slug);
  if (!module) notFound();
  return (
    <div className="content-wrap">
      <div className="breadcrumb"><Link href="/">Panel główny</Link><span> / </span><span>{module.group}</span></div>
      <section className="page-intro">
        <span className="eyebrow">MODUŁ SYNAPSE</span>
        <div className="page-title-row"><h1>{module.title}</h1><span className="pill">{slug==="skills-knowledge" ? "BAZA WIEDZY + AGENT RAG" : module.status==="demonstration" ? "WIDOK DEMO" : "PLANOWANY"}</span></div>
        <p>{module.description}</p>
      </section>
      {slug==="agent-registry" ? <AgentCatalogue/> :
       slug==="agent-orchestrator" ? <WorkflowSimulator/> :
       slug==="clients-data" ? <DataModelPreview/> :
       slug==="skills-knowledge" ? <KnowledgeLibrary/> :
       slug==="talent-hunter" ? <TalentHunter/> :
       <section className="panel placeholder">
         <span className="placeholder-icon">◇</span>
         <h2>Moduł przygotowany do implementacji</h2>
         <p>Architektura panelu uwzględnia ten obszar. Funkcje biznesowe nie są jeszcze dostępne.</p>
         <div className="outcome-grid">
           {module.outcomes.map((item) => <div className="outcome" key={item}><span>○</span>{item}</div>)}
         </div>
         <Link href="/modules/agent-registry" className="text-link">Zobacz katalog agentów →</Link>
       </section>}
      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">POWIĄZANIA</span><h2>Elementy pierwszego wdrożenia</h2></div></div>
        <div className="feature-grid small">
          <Link className="feature-card" href="/modules/clients-data"><h3>Model danych</h3><p>Wspólny słownik i źródła analiz.</p><span className="feature-link">Otwórz →</span></Link>
          <Link className="feature-card" href="/modules/agent-registry"><h3>Agent Registry</h3><p>{initialAgents.length} definicji w katalogu.</p><span className="feature-link">Otwórz →</span></Link>
          <Link className="feature-card" href="/modules/agent-orchestrator"><h3>Orchestrator</h3><p>Symulacja wieloetapowej diagnozy.</p><span className="feature-link">Otwórz →</span></Link>
        </div>
      </section>
    </div>
  );
}
