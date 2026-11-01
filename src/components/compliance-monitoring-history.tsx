import "server-only";
import { legalSources } from "../lib/compliance/regulatory-sources";
import { readComplianceHistory } from "../lib/compliance/history";

export async function ComplianceMonitoringHistory() {
  const history = await readComplianceHistory();
  const monitored = new Set(history.rows.map(row=>row.sourceId));
  return (
    <section className="section-block panel">
      <div className="panel-top">
        <h2>Historia rzeczywistego monitoringu</h2>
        <span className="pill">{history.status === "connected" ? "NEON PREVIEW · ODCZYT" : "NIEDOSTĘPNA"}</span>
      </div>
      <p className="muted">Dane pochodzą wyłącznie z izolowanej bazy testowej Neon. Zapisany odcisk strony internetowej nie jest potwierdzeniem zmiany prawa. Brak alertów prawnych i brak harmonogramu.</p>
      {history.status === "unavailable" ? (
        <div className="notice compact" role="status">{history.reason}. W produkcji nie odczytujemy testowej bazy.</div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi"><span>Zapisane stany źródeł</span><strong>{history.rows.length}</strong><small>Ostatnie 50 rekordów, bez duplikowania identycznych odcisków</small></div>
            <div className="kpi"><span>Źródła z historią</span><strong>{monitored.size}</strong><small>Z {legalSources.length} źródeł w rejestrze</small></div>
            <div className="kpi"><span>Aktywne harmonogramy</span><strong>0</strong><small>Monitoring automatyczny wyłączony</small></div>
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
