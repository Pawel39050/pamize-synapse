// Curated catalog of private OneDrive references. No document bytes or access tokens are stored here.
// A link is NOT an access grant: Microsoft enforces its own account permissions.
// Snapshot verified against PAMIZE Synapse / OneDrive on 2026-10-28.
// Future live Microsoft Graph sync requires server-side OAuth and per-user authorization.
export const knowledgeCategories = [
  {id:"strategy", label:"Strategia i model biznesowy", short:"Strategia", description:"Model biznesowy, oferta, sprzedaż i prezentacje"},
  {id:"methods", label:"Metodyki wdrażania AI", short:"Metodyki", description:"Projektowanie i wdrażanie cyfrowych pracowników"},
  {id:"procedures", label:"Procedury operacyjne", short:"Procedury", description:"Powtarzalne instrukcje i standardy działania"},
  {id:"skills", label:"Agenci AI i Skills", short:"Skills", description:"Pakiety umiejętności i konfiguracji agentów"},
  {id:"technical", label:"Manuale techniczne i bezpieczeństwo", short:"Manuale", description:"Infrastruktura, operacje i kontrola ryzyka"},
  {id:"academy", label:"Akademia i szkolenia", short:"Akademia", description:"Materiały edukacyjne i demonstracje"}
] as const;

export type KnowledgeCategory = (typeof knowledgeCategories)[number]["id"];
export type KnowledgeFileKind = "DOCX" | "PPTX" | "PDF" | "TXT" | "ZIP" | "MD" | "MP4";
export type KnowledgeDocument = {
  id: string;
  name: string;
  fileName: string;
  category: KnowledgeCategory;
  kind: KnowledgeFileKind;
  summary: string;
  tags: string[];
  url: string;
};

// URLs below were obtained from the connected personal OneDrive listing.
// The URLs point to private Microsoft-owned content, not anonymous sharing links.
export const knowledgeDocuments: KnowledgeDocument[] = [
  {id:"str-01",name:"Biznesplan PAMIZE / ETATIO",fileName:"ETATIO_biznesplan_PAMIZE.docx",category:"strategy",kind:"DOCX",summary:"Historyczny wariant biznesplanu i założeń oferty cyfrowych pracowników.",tags:["biznesplan","model biznesowy"],url:"https://onedrive.live.com/personal/712e32601a69edbe/_layouts/15/doc.aspx?resid=62feefe2-56dc-4246-ae85-f7af299b8b0c&cid=712e32601a69edbe"},
  {id:"str-02",name:"Prezentacja strategiczna PAMIZE / COADESSA",fileName:"PAMIZE_COADESSA_Prezentacja_Strategiczna.pptx",category:"strategy",kind:"PPTX",summary:"Prezentacja koncepcji biznesowej PAMIZE i COADESSA.",tags:["prezentacja","strategia"],url:"https://onedrive.live.com/personal/712e32601a69edbe/_layouts/15/doc.aspx?resid=bc09c45b-76a1-4fdb-8162-c2facb2a8a12&cid=712e32601a69edbe"},
  {id:"str-03",name:"Strategia, koszty, finansowanie i operatorzy",fileName:"PAMIZE_COADESSA_Strategia_Koszty_Finansowanie_i_Operatorzy_2026.docx",category:"strategy",kind:"DOCX",summary:"Wariant strategii z modelowaniem kosztów, źródeł finansowania i operatorów.",tags:["finanse","koszty","strategia"],url:"https://onedrive.live.com/personal/712e32601a69edbe/_layouts/15/doc.aspx?resid=b301bafd-01a0-4c8b-acdb-cc0562a682f6&cid=712e32601a69edbe"},
  {id:"str-04",name:"Strategia i koszty — pełna aktualizacja 2026",fileName:"PAMIZE_COADESSA_Strategia_Koszty_Pelna_Aktualizacja_2026(2).docx",category:"strategy",kind:"DOCX",summary:"Rozszerzone opracowanie strategiczne i kosztowe PAMIZE na 2026 rok.",tags:["strategia","koszty","2026"],url:"https://onedrive.live.com/personal/712e32601a69edbe/_layouts/15/doc.aspx?resid=8ff470eb-b6de-44ad-994f-dadfcfc81abf&cid=712e32601a69edbe"},
  {id:"str-05",name:"Prezentacja COADESSA — styl konsultingowy",fileName:"PAMIZE_COADESSA_Styl_Konsultingowy.pptx",category:"strategy",kind:"PPTX",summary:"Materiał prezentacyjny w stylistyce konsultingowej.",tags:["prezentacja","oferta"],url:"https://onedrive.live.com/personal/712e32601a69edbe/_layouts/15/doc.aspx?resid=5b2c96eb-be08-4388-8181-1a63a45ef880&cid=712e32601a69edbe"},
  {id:"str-06",name:"Plan operacyjny PAMIZE",fileName:"PAMIZE_plan_operacyjny_uzupelniony.docx",category:"strategy",kind:"DOCX",summary:"Roboczy plan organizacji i rozwoju działalności PAMIZE.",tags:["operacje","plan"],url:"https://onedrive.live.com/personal/712e32601a69edbe/_layouts/15/doc.aspx?resid=e4cc12d6-37af-4c90-85a5-7ba63b02ef70&cid=712e32601a69edbe"},
  {id:"str-07",name:"Strategia marketingowa cyfrowych pracowników",fileName:"PAMIZE_Strategia_Marketingowa_Cyfrowi_Pracownicy.docx",category:"strategy",kind:"DOCX",summary:"Pozycjonowanie usługi, komunikacja wartości i rozwój sprzedaży.",tags:["marketing","cyfrowi pracownicy"],url:"https://onedrive.live.com/personal/712e32601a69edbe/_layouts/15/doc.aspx?resid=cc889a86-20be-4045-8ede-4938d75e4ca3&cid=712e32601a69edbe"},
  {id:"str-08",name:"Schemat produktu COADESSA",fileName:"Schemat_produktu_COADESSA.docx",category:"strategy",kind:"DOCX",summary:"Koncepcja struktury produktu oraz jego składowych.",tags:["produkt","architektura oferty"],url:"https://onedrive.live.com/personal/712e32601a69edbe/_layouts/15/doc.aspx?resid=acdd8c1b-2f52-4dfc-914c-02b077f1102f&cid=712e32601a69edbe"},
  {id:"met-01",name:"AI Procurement OS — metodyka ofertowa",fileName:"AI_Procurement_OS_metodyka_ofertowa.docx",category:"methods",kind:"DOCX",summary:"Metodyka procesów zakupowych i ofertowania wspieranych przez AI.",tags:["zakupy","ofertowanie","procurement"],url:"https://onedrive.live.com/personal/712e32601a69edbe/_layouts/15/doc.aspx?resid=42890130-8767-4974-85fc-5ff0b80eaa51&cid=712e32601a69edbe"},
  {id:"met-02",name:"Metodyka wdrażania agentów AI — Synapse Dynamics",fileName:"Metodyka_wdrazania_agentow_AI_Synapse_Dynamics.docx",category:"methods",kind:"DOCX",summary:"Etapy projektowania i implementacji agentów w środowisku Synapse.",tags:["metodyka","wdrożenie","agenci"],url:"https://onedrive.live.com/personal/712e32601a69edbe/_layouts/15/doc.aspx?resid=b85559d9-fb37-4c21-a8eb-3eae77eca530&cid=712e32601a69edbe"},
  {id:"pro-01",name:"Procedura wdrażania architektury Synapse",fileName:"001_Procedura_wdrazania_architektury_Synapse.docx",category:"procedures",kind:"DOCX",summary:"Instrukcja organizacji kolejnych etapów budowy architektury Synapse.",tags:["synapse","architektura","procedura"],url:"https://onedrive.live.com/personal/712e32601a69edbe/_layouts/15/doc.aspx?resid=0a5bb953-0f77-4c19-93de-3a32a45eeb3e&cid=712e32601a69edbe"},
  {id:"pro-02",name:"Agent ds. przetargów i ofertowania — procedura",fileName:"Agent ds przetargow i ofertowania procedura.docx",category:"procedures",kind:"DOCX",summary:"Procedura wykonywania zadań przez agenta przetargowego i ofertowego.",tags:["zamówienia publiczne","przetargi","agent"],url:"https://onedrive.live.com/personal/712e32601a69edbe/_layouts/15/doc.aspx?resid=13ccf9f7-602c-46df-94b3-e85076daa541&cid=712e32601a69edbe"},
  {id:"ski-01",name:"Job Market & PZP — pakiet MVP",fileName:"PAMIZE_Skill_Job_Market_PZP_MVP.zip",category:"skills",kind:"ZIP",summary:"Pakiet prototypowy skanowania ofert pracy i zamówień publicznych.",tags:["talent hunter","PZP","skill"],url:"https://onedrive.live.com?cid=712e32601a69edbe&id=712E32601A69EDBE!s44b1e9251f7545fabd645ef3b9bf83c2"},
  {id:"ski-02",name:"PZP v0.2 — wydajność i Bid/No-Bid",fileName:"PAMIZE_Skill_PZP_v0_2_Wydajnosc_i_BidNoBid.zip",category:"skills",kind:"ZIP",summary:"Rozwinięcie umiejętności agenta PZP o ocenę efektywności i decyzję ofertową.",tags:["PZP","bid/no-bid","skill"],url:"https://onedrive.live.com?cid=712e32601a69edbe&id=712E32601A69EDBE!s07d5d42abfd44bd89861c30cc18bc7be"},
  {id:"ski-03",name:"Definicja SKILL.md",fileName:"SKILL.md",category:"skills",kind:"MD",summary:"Instrukcja definicji umiejętności agenta w formacie Markdown.",tags:["skill","instrukcja"],url:"https://onedrive.live.com?cid=712e32601a69edbe&id=712E32601A69EDBE!s1496df6dcef54e72a2d392f74dcfc77f"},
  {id:"tec-01",name:"Manual DevOps, LLMOps, AgentOps i bezpieczeństwo",fileName:"PAMIZE_Manual_DevOps_LLMOps_AgentOps_Bezpieczenstwo.docx",category:"technical",kind:"DOCX",summary:"Zagadnienia utrzymania, operacji modeli i agentów oraz bezpieczeństwa.",tags:["DevOps","LLMOps","AgentOps","security"],url:"https://onedrive.live.com/personal/712e32601a69edbe/_layouts/15/doc.aspx?resid=1342ab35-9032-4473-9e12-ac71e3c181e8&cid=712e32601a69edbe"},
  {id:"tec-02",name:"Manual operacyjny Terraform — aktualizacja",fileName:"PAMIZE_Manual_Operacyjny_Terraform_Aktualizacja.docx",category:"technical",kind:"DOCX",summary:"Zastosowanie Terraform do automatyzacji infrastruktury Synapse.",tags:["Terraform","infrastruktura","IaC"],url:"https://onedrive.live.com/personal/712e32601a69edbe/_layouts/15/doc.aspx?resid=d519a33d-1d22-40b7-bd19-4230348d19ec&cid=712e32601a69edbe"},
  {id:"aca-01",name:"Synapse — demonstracja agenta głosowego",fileName:"PAMIZE_Synapse_Demo_Agent_Glosowy.mp4",category:"academy",kind:"MP4",summary:"Materiał wideo pokazujący koncepcję działania agenta głosowego.",tags:["voice","demo","szkolenie"],url:"https://onedrive.live.com?cid=712e32601a69edbe&id=712E32601A69EDBE!s411fe3a4369c49c69104ac72b90f45ed"}
];
