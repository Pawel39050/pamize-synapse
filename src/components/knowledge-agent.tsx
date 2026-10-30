'use client';
import {useState} from 'react';

export function KnowledgeAgent() {
  const [busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState('');
  async function exportKnowledge() {
    if(busy) return;
    setBusy(true);setError('');setStatus('Sprawdzam aktualną bibliotekę OneDrive…');
    try {
      const response=await fetch('/api/microsoft/sync',{cache:'no-store'});
      const catalog=await response.json();
      if(!response.ok || !Array.isArray(catalog.documents)) throw new Error(catalog.error || 'Połącz Microsoft, aby pobrać bazę.');
      const readable=catalog.documents.filter((d:{fileName:string})=>/\.(docx|pptx|pdf|txt|md)$/i.test(d.fileName));
      if(readable.length===0) throw new Error('W bibliotece nie ma obsługiwanych dokumentów tekstowych.');
      if(readable.length>100) throw new Error('Biblioteka przekracza limit 100 dokumentów.');
      const documents=[], errors:string[]=[];let bytes=0;
      for(const [index,doc] of readable.entries()) {
        setStatus(`Pobieram ${index+1} z ${readable.length}: ${doc.fileName}`);
        const r=await fetch('/api/microsoft/knowledge-content?id='+encodeURIComponent(doc.id.replace(/^graph-/,'')),{cache:'no-store'});
        const item=await r.json();
        if(!r.ok) {errors.push(doc.fileName+': '+(item.error||'brak dostępu'));continue;}
        bytes+=item.data.length;
        if(bytes>19*1024*1024) throw new Error('Pakiet przekracza limit 19 MB. Pobierz mniejszy zakres dokumentów.');
        documents.push(item);
      }
      if(!documents.length) throw new Error(errors.join(' '));
      if(errors.length || catalog.warnings?.length) throw new Error('Nie pobrano kompletnej bazy. Spróbuj ponownie. '+[...errors,...(catalog.warnings??[])].join(' · '));
      const bundle={format:'pamize-knowledge-v1',source:'OneDrive / PAMIZE Synapse',exportedAt:new Date().toISOString(),documents,errors};
      const url=URL.createObjectURL(new Blob([JSON.stringify(bundle)],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='PAMIZE_baza_wiedzy_'+new Date().toISOString().slice(0,10)+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setStatus(`Pobrano ${documents.length} dokumentów. W agencie wybierz „Wczytaj bazę z Synapse”. ZIP i filmy pomijamy.`);
    } catch(e) {setError(e instanceof Error?e.message:'Nie udało się pobrać bazy.');setStatus('');}
    finally {setBusy(false);}
  }
  return <section className="panel" aria-label="Agent wiedzy PAMIZE">
    <div className="panel-top"><div><span className="eyebrow">AGENT WIEDZY · RAG · MODEL LOKALNY</span><h2>Zapytaj swoje procedury</h2></div><span className="pill">NOWY MODUŁ</span></div>
    <p className="muted">Agent wyszukuje właściwe fragmenty dokumentów i przygotowuje odpowiedź ze wskazaniem źródeł. Odpowiada z lokalnej kopii bazy; pokazuje braki i rozbieżności między zapisami.</p>
    <div className="outcome-grid"><div className="outcome">01 · Wybierz dokumenty i zadaj pytanie</div><div className="outcome">02 · Otrzymaj odpowiedź z odnośnikami</div><div className="outcome">03 · Sprawdź akapit lub slajd źródłowy</div></div>
    <p className="muted">Model i baza pracują na Twoim komputerze. Uruchom lokalnego agenta plikiem „Uruchom Synapse Wiedza.cmd”. Pierwsza baza jest kopią OneDrive z 30.10.2026. Aktualizacje pobierasz przyciskiem poniżej i wczytujesz w agencie. Usunięcie dokumentu w OneDrive wymaga ponownego pobrania i wczytania bazy.</p>
    <div className="microsoft-sync-buttons"><a className="btn primary" href="http://127.0.0.1:8766/?synapse=1" target="_blank" rel="noopener noreferrer">Otwórz agenta wiedzy ↗</a><button type="button" className="btn secondary" disabled={busy} onClick={exportKnowledge}>{busy?'Pobieranie…':'Pobierz aktualną bazę z OneDrive'}</button></div>
    <p role="status" aria-live="polite">{status}</p>{error&&<p className="microsoft-sync-error" role="alert">{error}</p>}
  </section>;
}
