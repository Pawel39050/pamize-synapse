export type HunterCategory="pzp"|"zakupy";
export type HunterDecision="nowe"|"zatwierdzone"|"odrzucone";
export type HunterTask={name:string;evidence:string;share:number;automatable:number;confidence:"niska"|"średnia"|"wysoka"};
export type HunterResult={
  id:string;createdAt:string;methodology:"1.0";
  title:string;company:string;location:string;sourceUrl:string;category:HunterCategory;
  engine:"ai"|"reguły";model:string;
  tasks:HunterTask[];potential:number;score:number;quality:number;
  classification:"silny lead"|"do diagnozy"|"niski priorytet";
  salary:string;risks:string[];recommendation:string;
  decision:HunterDecision;decisionNote:string;
  caveat:string;tokenUsage:number|null;
};
export type HunterInput={title:string;company:string;location:string;sourceUrl:string;category:HunterCategory;text:string};
export const METHOD_VERSION="1.0";
const clamp=(x:unknown,min=0,max=100)=>Math.round(Math.min(max,Math.max(min,typeof x==="number"&&Number.isFinite(x)?x:0)));
export function normalizedTasks(tasks:HunterTask[]):HunterTask[]{
  const trimmed=tasks.slice(0,10).filter(t=>t.name.trim()&&t.evidence.trim());
  const sum=trimmed.reduce((a,t)=>a+Math.max(0,t.share),0);
  if(sum<=0)return [];
  // Largest-remainder normalization: shares always sum to 100 and never become negative.
  const fractional=trimmed.map((t,i)=>({index:i,raw:100*Math.max(0,t.share)/sum}));
  const shares=fractional.map(x=>Math.floor(x.raw));
  const missing=100-shares.reduce((a,b)=>a+b,0);
  const byRemainder=[...fractional].sort((a,b)=>(b.raw-Math.floor(b.raw))-(a.raw-Math.floor(a.raw)));
  for(let i=0;i<missing;i++)shares[byRemainder[i].index]+=1;
  return trimmed.map((t,i)=>({...t,name:t.name.slice(0,140),evidence:t.evidence.slice(0,260),
    share:shares[i],automatable:clamp(t.automatable),
    confidence:["niska","średnia","wysoka"].includes(t.confidence)?t.confidence:"niska"
  }));
}
export function buildHunterResult(input:HunterInput,data:{
 tasks:HunterTask[];salary?:string;risks?:string[];recommendation?:string;quality?:number;feasibility?:number;economic?:number;
},engine:"ai"|"reguły",model=""):HunterResult{
  const tasks=normalizedTasks(data.tasks);
  if(!tasks.length)throw new Error("Za mało informacji o obowiązkach. Wklej pełniejszy opis oferty.");
  const potential=clamp(tasks.reduce((a,t)=>a+t.share*t.automatable/100,0));
  const quality=clamp(data.quality??25);
  const feasibility=clamp(data.feasibility??35),economic=clamp(data.economic??30);
  const score=clamp(potential*.4+feasibility*.25+economic*.2+quality*.15);
  // Quality and task confidence are separate from uncertain time-share assumptions.
  // No automatic approval: 'silny lead' remains a hypothesis requiring human review.
  const strong=potential>=60&&quality>=70&&tasks.filter(t=>t.confidence!=="niska").length>=2&&engine==="ai";
  const classification=strong?"silny lead":potential>=40?"do diagnozy":"niski priorytet";
  return {
    id:crypto.randomUUID(),createdAt:new Date().toISOString(),methodology:"1.0",
    title:input.title.trim().slice(0,140)||"Stanowisko z ogłoszenia",
    company:input.company.trim().slice(0,140)||"Pracodawca niepodany",
    location:input.location.trim().slice(0,140),sourceUrl:input.sourceUrl,
    category:input.category,engine,model,tasks,potential,score,quality,classification,
    salary:(data.salary??"Nie podano / nieustalone").slice(0,160),
    risks:(data.risks??[]).slice(0,8).map(x=>x.slice(0,300)),
    recommendation:(data.recommendation??"Zweryfikować zakres obowiązków i czas pracy podczas discovery.").slice(0,800),
    decision:"nowe",decisionNote:"",
    caveat:"Wynik to hipoteza z ogłoszenia, nie potwierdzona automatyzacja etatu. Udziały czasu są szacunkowe; wymagają discovery i weryfikacji człowieka.",
    tokenUsage:null
  };
}
const pzp=[
  ["Monitoring postępowań",/monitor|wyszuk|przegląd|śledzen|bip|platform.*zakup|publikac/i,18,90],
  ["Analiza SWZ i dokumentacji",/analiz|swz|siwz|dokumentac|warunków|specyfikac/i,26,75],
  ["Przygotowanie ofert i dokumentów",/przygotow|ofert|formularz|załącznik|kosztorys/i,27,65],
  ["Komunikacja i wyjaśnienia",/komunikac|kontakt|wyjaśn|uzgodn|pytan/i,15,35],
  ["Decyzje, ocena i zatwierdzenia",/zatwierdz|decyzj|negocjac|podpis|odpowiedzialno/i,14,10]
] as const;
const zakupy=[
  ["Wyszukiwanie i ocena dostawców",/dostawc|sourcing|rynk|poszuk|monitor/i,22,70],
  ["Zapytania i porównanie ofert",/zapyt|ofert|porówn|cennik|wycen/i,28,80],
  ["Obsługa zamówień i danych",/zamówie|erp|ewidenc|faktur|raport|system/i,28,75],
  ["Komunikacja i negocjacje",/negocjac|kontakt|komunikac|uzgodn/i,14,35],
  ["Strategiczne decyzje zakupowe",/strateg|decyzj|zatwierdz|umow|ryzyk/i,8,15]
] as const;
export function ruleBasedAnalysis(input:HunterInput):HunterResult{
  const candidates=input.category==="pzp"?pzp:zakupy;
  const tasks:HunterTask[]=[];
  for(const [name,re,share,automatable] of candidates){
    const match=re.exec(input.text);
    if(!match)continue;
    const start=Math.max(0,match.index-55),end=Math.min(input.text.length,match.index+110);
    tasks.push({name,evidence:input.text.slice(start,end).replace(/\s+/g," ").trim(),share,automatable,confidence:"niska"});
  }
  if(tasks.length<2)throw new Error("Nie zidentyfikowano wystarczająco wielu obowiązków. Dodaj pełny zakres pracy z ogłoszenia.");
  const r=buildHunterResult(input,{tasks,quality:Math.min(45,15+tasks.length*6),feasibility:35,economic:25,
    risks:["Reguły rozpoznają słowa kluczowe, nie rozumieją pełnego kontekstu.","Udziały czasu i procenty automatyzacji są wyłącznie orientacyjnymi założeniami."],
    recommendation:"Wymagana weryfikacja człowieka. Aby uzyskać analizę semantyczną, skonfiguruj serwerowy klucz dostępu do modelu AI."
  },"reguły");
  return r;
}
