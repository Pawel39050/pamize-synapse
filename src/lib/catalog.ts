import type { AgentDefinition } from "./contracts";

export type ModuleGroup = "Workspace" | "Intelligence" | "Digital Workforce" | "Governance";
export type SynapseModule = {
  slug: string;
  title: string;
  group: ModuleGroup;
  description: string;
  outcomes: string[];
  status: "demonstration" | "planned";
};

export const modules: SynapseModule[] = [
  {slug:"organizer",title:"Synapse Organizer",group:"Workspace",description:"Osobiste zadania, kalendarz oraz organizacja pracy PAMIZE.",outcomes:["Lista zadań","Kalendarze Microsoft 365","Przypomnienia"],status:"planned"},
  {slug:"mail-calendar",title:"Poczta i kalendarz",group:"Workspace",description:"Planowane połączenie skrzynek Outlook i home.pl oraz terminarzy.",outcomes:["Integracja Outlook","Integracja home.pl","Zadania ze spotkań"],status:"planned"},
  {slug:"growth-crm",title:"Growth & CRM",group:"Workspace",description:"Relacje z klientami, sprzedaż i pipeline transformacji.",outcomes:["Szanse sprzedażowe","Oferty","Relacje"],status:"planned"},
  {slug:"marketing",title:"Marketing i media",group:"Workspace",description:"Planowanie kampanii PAMIZE i komunikacji marketingowej.",outcomes:["Kalendarz treści","Kampanie","Analityka"],status:"planned"},
  {slug:"talent-hunter",title:"Talent Hunter",group:"Workspace",description:"Identyfikacja stanowisk i procesów nadających się do automatyzacji.",outcomes:["Wyszukiwanie ofert","Ocena automatyzacji","Kwalifikacja leadów"],status:"planned"},
  {slug:"clients-data",title:"Klienci i dane",group:"Workspace",description:"Projekty klientów, importy, walidacja i wspólny model danych.",outcomes:["Universal Data Model","Jakość danych","Integracje ERP"],status:"demonstration"},

  {slug:"discovery",title:"Discovery i ankiety",group:"Intelligence",description:"Diagnoza organizacyjna, wywiady i analiza odpowiedzi.",outcomes:["Ankieta 50 pytań","Wywiad adaptacyjny","Mapa problemów"],status:"planned"},
  {slug:"economic-intelligence",title:"Economic Intelligence",group:"Intelligence",description:"Rentowność klientów, produktów, płynność oraz kapitał obrotowy.",outcomes:["Marża pokrycia","DSO / DPO / DIO","Scenariusze"],status:"planned"},
  {slug:"production",title:"Production Intelligence",group:"Intelligence",description:"Wydajność zakładów, ograniczenia, przezbrojenia i przestoje.",outcomes:["Wąskie gardła","OEE","Ekonomika produkcji"],status:"planned"},
  {slug:"procurement-logistics",title:"Zakupy i logistyka",group:"Intelligence",description:"Koszty zakupów, warunki handlowe, zapasy i transport.",outcomes:["Analiza dostawców","Zapasy","Koszty dostaw"],status:"planned"},

  {slug:"agent-registry",title:"Agent Registry",group:"Digital Workforce",description:"Rejestr ról cyfrowych pracowników, ich kompetencji i uprawnień.",outcomes:["Definicje agentów","Skills i narzędzia","Poziomy autonomii"],status:"demonstration"},
  {slug:"agent-orchestrator",title:"Agent Orchestrator",group:"Digital Workforce",description:"Delegowanie zadań i koordynacja współpracujących agentów.",outcomes:["Workflow","Zatwierdzenia","Ślad audytowy"],status:"demonstration"},
  {slug:"skills-knowledge",title:"Knowledge & Academy",group:"Digital Workforce",description:"Katalog 18 dokumentów PAMIZE z OneDrive: wyszukiwanie metadanych, kategorie i otwieranie materiałów bez ich publicznego kopiowania.",outcomes:["Wyszukiwarka dokumentów","Kategorie wiedzy","Bezpieczne linki OneDrive"],status:"demonstration"},
  {slug:"development-lab",title:"Development Lab",group:"Digital Workforce",description:"Projektowanie, testowanie i ewaluacja nowych agentów.",outcomes:["Eksperymenty","Testy jakości","Wersje"],status:"planned"},

  {slug:"runtime",title:"Synapse Runtime",group:"Governance",description:"Monitorowanie wykonania agentów i ich kosztów.",outcomes:["Wywołania modeli","Błędy","Budżety"],status:"planned"},
  {slug:"control",title:"Control & Security",group:"Governance",description:"Kontrola dostępu, zgód, izolacja klientów i bezpieczeństwo.",outcomes:["Role i polityki","Audit log","Zatwierdzenia"],status:"planned"},
  {slug:"performance",title:"Performance & Benefits",group:"Governance",description:"Weryfikacja KPI oraz faktycznie uzyskanych korzyści finansowych.",outcomes:["KPI","Rejestr korzyści","Kontrola CFO"],status:"planned"},
  {slug:"transformation",title:"Transformation Programs",group:"Governance",description:"Inicjatywy poprawy efektywności, kierownicy i komitety sterujące.",outcomes:["Program zmian","Zadania","Komitet sterujący"],status:"planned"}
];

export const initialAgents: AgentDefinition[] = [
  {key:"AG-CORE-001",version:"0.1.0",name:"Enterprise Diagnostic Coordinator",family:"Strategic",purpose:"Delegowanie diagnoz i konsolidacja ustaleń.",skillKeys:["coordinate-diagnosis","compare-findings"],toolKeys:["tasks.read","findings.read"],lifecycle:"planned"},
  {key:"AG-ORG-001",version:"0.1.0",name:"Discovery Agent",family:"Organization",purpose:"Wywiad adaptacyjny i diagnoza organizacyjna.",skillKeys:["run-survey","generate-hypotheses"],toolKeys:["surveys.read"],lifecycle:"planned"},
  {key:"AG-FIN-002",version:"0.1.0",name:"Profitability Agent",family:"Finance",purpose:"Rentowność klientów, produktów i transakcji.",skillKeys:["analyze-contribution-margin"],toolKeys:["profitability.calculate"],lifecycle:"planned"},
  {key:"AG-FIN-001",version:"0.1.0",name:"Financial Intelligence Agent",family:"Finance",purpose:"Płynność i kapitał obrotowy.",skillKeys:["analyze-working-capital"],toolKeys:["financial-metrics.calculate"],lifecycle:"planned"},
  {key:"SYS-DIAG-001",version:"0.1.0",name:"Diagnostic Calculation Engine",family:"Deterministic service",purpose:"Kontrolowane obliczenia i walidacja danych (nie jest modelem AI).",skillKeys:["validate-data","calculate-metrics"],toolKeys:[],lifecycle:"planned"}
];

export const groups: ModuleGroup[] = ["Workspace","Intelligence","Digital Workforce","Governance"];
