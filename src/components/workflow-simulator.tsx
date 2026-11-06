"use client";

import { useState } from "react";

const steps = [
  {name:"Zlecenie diagnozy",owner:"Menedżer PAMIZE",detail:"Wybór zakresu analizy rentowności klienta"},
  {name:"Plan i walidacja",owner:"Diagnostic Coordinator",detail:"Kontrola dostępności i jakości danych"},
  {name:"Analiza rentowności",owner:"Profitability Agent",detail:"Zlecenie obliczeń do silnika deterministycznego"},
  {name:"Analiza finansowa",owner:"Financial Intelligence Agent",detail:"DSO, kapitał obrotowy i koszt finansowania"},
  {name:"Konsolidacja wniosków",owner:"Diagnostic Coordinator",detail:"Sprawdzenie dowodów, rozbieżności i podwójnych korzyści"},
  {name:"Akceptacja przez człowieka",owner:"Menedżer PAMIZE",detail:"Decyzja o dalszym procedowaniu rekomendacji"}
] as const;

export function WorkflowSimulator() {
  const [current, setCurrent] = useState(0);
  return (
    <div className="panel">
      <div className="panel-top"><div><span className="eyebrow">PRZEPŁYW PRACY · SYMULACJA</span><h2>Diagnoza rentowności klientów</h2></div><span className="pill">DEMO</span></div>
      <div className="notice compact">Przycisk odtwarza wyłącznie demonstrację stanów w przeglądarce. Nie uruchamia agentów AI, nie tworzy zadań serwerowych i niczego nie zapisuje.</div>
      <ol className="timeline">
        {steps.map((step,index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li className={"timeline-step" + (done ? " completed" : "") + (active ? " active" : "")} key={step.name}>
              <span className="timeline-number">{done ? "✓" : index+1}</span>
              <div><strong>{step.name}</strong><small>{step.owner}</small><p>{step.detail}</p></div>
              <span className="state-label">{done ? "Wykonano w symulacji" : active ? "Bieżący krok" : "Oczekuje"}</span>
            </li>
          );
        })}
      </ol>
      <div className="simulator-actions">
        <button className="btn primary" type="button" onClick={() => setCurrent(Math.min(steps.length,current+1))} disabled={current>=steps.length}>Następny krok →</button>
        <button className="btn secondary" type="button" onClick={() => setCurrent(0)}>Rozpocznij od nowa</button>
        <span className="helper">{current>=steps.length ? "Scenariusz demonstracyjny zakończony." : "Etap " + (current+1) + " z " + steps.length}</span>
      </div>
    </div>
  );
}
