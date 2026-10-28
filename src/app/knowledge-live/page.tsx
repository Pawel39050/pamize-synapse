import Link from "next/link";
import {KnowledgeLibrary} from "../../components/knowledge-library";

export const dynamic="force-dynamic";

export default function KnowledgeLivePage(){
  return (
    <div className="content-wrap">
      <div className="breadcrumb"><Link href="/">Panel główny</Link><span> / </span><Link href="/modules/skills-knowledge">Knowledge & Academy</Link><span> / Synchronizacja</span></div>
      <section className="page-intro">
        <span className="eyebrow">PAMIZE SYNAPSE · MICROSOFT GRAPH</span>
        <div className="page-title-row"><h1>Biblioteka wiedzy — synchronizacja</h1><span className="pill">MICROSOFT GRAPH</span></div>
        <p>Bezpieczny, odczytowy dostęp do katalogu dokumentów PAMIZE w OneDrive. Połącz Microsoft lub synchronizuj pliki, korzystając z panelu poniżej.</p>
      </section>
      <KnowledgeLibrary/>
    </div>
  );
}
