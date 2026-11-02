import "server-only";
import { legalSources } from "../lib/compliance/regulatory-sources";
import { readComplianceHistory } from "../lib/compliance/history";
import { listLegalActVersions } from "../lib/compliance/legal-version-store";
import { readGdprCorrigendumReport } from "../lib/compliance/corrigendum-report-store";

export async function ComplianceMonitoringHistory() {
  const history = await readComplianceHistory();
  const monitored = new Set(history.rows.map(row=>row.sourceId));
  const legalVersions = await listLegalActVersions("32016R0679").catch(() => []);
  const corrigendum = await readGdprCorrigendumReport();
  return (
    <section className="section-block panel">
      <div className="panel-top">
        <h2>Historia rzeczywistego monitoringu</h2>
        <span className="pill">{history.status === "connected" ? "NEON PREVIEW · ODCZYT" : "NIEDOSTĘPNA"}</span>
      </div>
      <div className="notice compact">
        <strong>Rejestr dokumentów prawnych — RODO</strong>
        <p>Wersje pobrane z CELLAR: {legalVersions.length}. Każda wersja wymaga zatwierdzenia urzędowej tożsamości dokumentu.</p>
        {legalVersions.map(v => <p key={v.documentSha256}>
          CELEX {v.celex} · {v.articles.length} artykułów · Pobrano: {new Date(v.retrievedAt).toLocaleString("pl-PL",{timeZone:"Europe/Warsaw"})}
          · Status: {v.authenticity === "official-version-verified" ? "wersja zweryfikowana" : "oczekuje na weryfikację urzędową"}
          · SHA-256: {v.documentSha256.slice(0,16)}…
        </p>)}
      </div>
      <div className="notice compact">
        <h3>Raport sprostowania RODO — 23 maja 2018 (język EN)</h3>
        <p>CELEX: {corrigendum.correctionCelex} · Zidentyfikowane korekty: {corrigendum.coverageCount} · Porównania fragmentów: {corrigendum.changes.length} · Zatwierdzone prawnie: {corrigendum.verifiedCount} · Zapisy opisowe zamiast tekstu: {corrigendum.placeholderCount} · Status: wymaga weryfikacji prawnej.</p>
        {corrigendum.status === "connected" && <p><strong>Spójność rejestru:</strong> {corrigendum.unreviewedSections.length===0 && corrigendum.orphanedSections.length===0 ? "15 pozycji sparowanych z zapisanymi porównaniami" : "wykryto niespójności — wymagana kontrola"}</p>}
        {corrigendum.orphanedSections.length>0 && <p><strong>Porównania bez pozycji źródłowej:</strong> {corrigendum.orphanedSections.join(", ")}</p>}
        {corrigendum.unreviewedSections.length > 0 && <p><strong>Oczekują na szczegółową ekstrakcję:</strong> {corrigendum.unreviewedSections.join(", ")}</p>}
        <p><a href={corrigendum.officialUrl} target="_blank" rel="noopener noreferrer">Dokument urzędowy EUR-Lex</a></p>
        {corrigendum.status === "unavailable" ? <p role="status">{corrigendum.reason}</p> : (
          <div className="agent-list">
            {corrigendum.changes.map(change => (
              <article className="model-card" key={change.section}>
                <h4>{change.section}</h4>
                <p><strong>Przed (fragment):</strong> {change.previous}</p>
                <p><strong>Po (fragment lub informacja o usunięciu):</strong> {change.corrected}</p>
                <small>{change.corrected.startsWith("[") ? "Opis operacji, a nie dosłowny tekst po zmianie. " : ""}Porównanie może obejmować wyłącznie fragment, nie pełen artykuł. Wymagana kontrola brzmienia i zatwierdzenie przez prawnika.</small>
              </article>
            ))}
          </div>
        )}
      </div>
      <p className="muted">Dane pochodzą wyłącznie z izolowanej bazy testowej Neon. Zapisany odcisk strony internetowej nie jest potwierdzeniem zmiany prawa. Brak automatycznego rozstrzygania skutków prawnych.</p>
      {history.status === "unavailable" ? (
        <div className="notice compact" role="status">{history.reason}. W produkcji nie odczytujemy testowej bazy.</div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi"><span>Zapisane stany źródeł</span><strong>{history.rows.length}</strong><small>Ostatnie 50 rekordów, bez duplikowania identycznych odcisków</small></div>
            <div className="kpi"><span>Źródła z historią</span><strong>{monitored.size}</strong><small>Z {legalSources.length} źródeł w rejestrze</small></div>
            <div className="kpi"><span>Monitoring UODO</span><strong>06:00</strong><small>Codzienny harmonogram działa poza tym panelem; zapisy stanów źródeł są odrębne od zmian prawa</small></div>
            <div className="kpi"><span>Zweryfikowane zmiany prawa</span><strong>0</strong><small>Brak zatwierdzonych analiz prawnych</small></div>
          </div>
          {history.rows.length === 0 ? <p className="muted">Brak zapisanych stanów monitoringu.</p> :
          <div className="agent-list">
            {history.rows.map(row=>{
              const source=legalSources.find(s=>s.id===row.sourceId);
              return <div className="model-card" key={row.sourceId+row.sha256}>
                <h3>{source?.title ?? row.sourceId}</h3>
                <p>Źródło: {row.sourceId} · Pobrano: {new Date(row.fetchedAt).toLocaleString("pl-PL",{timeZone:"Europe/Warsaw"})}</p>
                <p style={{overflowWrap:"anywhere"}}><strong>SHA-256:</strong> <code>{row.sha256}</code></p>
                <p className="muted">ETag: {row.etag ?? "brak"} · Last-Modified: {row.lastModified ?? "brak"}</p>
                <span className="tiny-tag">Zarejestrowany stan strony · ocena prawna: nieprzeprowadzona</span>
              </div>;
            })}
          </div>}
        </>
      )}
    </section>
  );
}
