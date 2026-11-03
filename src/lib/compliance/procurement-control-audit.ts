/** Deterministic internal-control simulator. Synthetic transactions only.
 * Findings are against illustrative internal policy, not adjudicated legal infringements. */
export type Offer={supplierId:string;pricePln:number;qualityScore:number;deliveryDays:number;eligible:boolean};
export type ProcurementCase={
 id:string;title:string;requestedAmountPln:number;budgetLimitPln:number;
 approvalsRequiredAbovePln:number;approvedBy:string|null;requesterId:string;
 selectedSupplierId:string;offers:Offer[];selectionCriteriaRecorded:boolean;
 conflictDeclared:boolean;auditTrailComplete:boolean;personalDataUsed:boolean;
};
export type ProcurementFinding={
 code:"BUDGET_LIMIT"|"MISSING_APPROVAL"|"CONFLICT_OF_INTEREST"|"INSUFFICIENT_COMPETITION"|"UNJUSTIFIED_SELECTION"|"MISSING_CRITERIA"|"MISSING_AUDIT"|"GDPR_REVIEW";
 category:"policy-control"|"evidence-gap"|"legal-review";
 severity:"high"|"medium"|"review";
 description:string;recommendedAction:string;haltRecommended:boolean;
};
export type ProcurementResult={caseId:string;findings:ProcurementFinding[];status:"review-required"|"controls-passed";policyVersion:"PROC-DEMO-1";reviewRequired:true};
const add=(findings:ProcurementFinding[],code:ProcurementFinding["code"],category:ProcurementFinding["category"],severity:ProcurementFinding["severity"],description:string,recommendedAction:string,haltRecommended=false)=>{
 findings.push({code,category,severity,description,recommendedAction,haltRecommended});
};
export function auditProcurementCase(c:ProcurementCase):ProcurementResult{
 if(!c.id.trim()||!c.requesterId.trim()||!c.selectedSupplierId.trim()||!c.offers.length)throw Error("Invalid procurement case identity or offers");
 for(const n of [c.requestedAmountPln,c.budgetLimitPln,c.approvalsRequiredAbovePln]){
  if(!Number.isFinite(n)||n<0)throw Error("Invalid monetary value");
 }
 if(c.offers.some(o=>!o.supplierId.trim()||!Number.isFinite(o.pricePln)||o.pricePln<0||!Number.isFinite(o.qualityScore)||o.qualityScore<0||o.qualityScore>100||!Number.isFinite(o.deliveryDays)||o.deliveryDays<0))throw Error("Invalid offer");
 if(new Set(c.offers.map(o=>o.supplierId)).size!==c.offers.length)throw Error("Duplicate supplier IDs");
 const findings:ProcurementFinding[]=[];
 if(c.requestedAmountPln>c.budgetLimitPln)
  add(findings,"BUDGET_LIMIT","policy-control","high","Kwota wniosku przekracza przykładowy limit budżetu.","Wstrzymać zakup i uzyskać akceptację budżetu.",true);
 if(c.requestedAmountPln>c.approvalsRequiredAbovePln&&(!c.approvedBy||c.approvedBy===c.requesterId))
  add(findings,"MISSING_APPROVAL","policy-control","high","Brak zatwierdzenia przez odrębną uprawnioną osobę.","Wstrzymać zamówienie do zatwierdzenia.",true);
 if(c.conflictDeclared)
  add(findings,"CONFLICT_OF_INTEREST","legal-review","high","Zadeklarowano potencjalny konflikt interesów; nie przesądza to o naruszeniu prawa.","Przekazać sprawę do bezstronnej oceny i wyłączyć zainteresowaną osobę z decyzji.",true);
 const eligible=c.offers.filter(o=>o.eligible);
 if(eligible.length<2)
  add(findings,"INSUFFICIENT_COMPETITION","policy-control","medium","Mniej niż dwie kwalifikujące się oferty w przykładzie; odstępstwa wymagają udokumentowania.","Zweryfikować tryb i podstawę odstępstwa od przyjętej procedury.");
 if(!c.selectionCriteriaRecorded)
  add(findings,"MISSING_CRITERIA","evidence-gap","medium","Nie zapisano kryteriów oceny ofert.","Uzupełnić kryteria i zatwierdzić je przed wyborem.");
 const chosen=c.offers.find(o=>o.supplierId===c.selectedSupplierId);
 if(!chosen||!chosen.eligible)
  add(findings,"UNJUSTIFIED_SELECTION","policy-control","high","Wybrany dostawca nie ma kwalifikującej się oferty.","Wstrzymać decyzję i zweryfikować zgodność oferty z wymaganiami.",true);
 else if(c.selectionCriteriaRecorded&&eligible.some(o=>o.pricePln<chosen.pricePln))
  add(findings,"UNJUSTIFIED_SELECTION","evidence-gap","medium","Wybrano ofertę droższą niż inna kwalifikująca się oferta; możliwe uzasadnienie jakościowe nie zostało przeanalizowane.","Zweryfikować wagę ceny, jakości i terminu. Nie uznawać automatycznie tańszej oferty za najlepszą.");
 if(!c.auditTrailComplete)
  add(findings,"MISSING_AUDIT","evidence-gap","high","Brakuje kompletnego śladu decyzji zakupowej.","Uzupełnić dowody i historię zatwierdzeń przed realizacją.",true);
 if(c.personalDataUsed)
  add(findings,"GDPR_REVIEW","legal-review","review","W procesie mogą występować dane osobowe; sam fakt ich użycia nie oznacza naruszenia.","Ustalić role, podstawę prawną, zakres danych, retencję i zabezpieczenia.");
 return {caseId:c.id,findings,status:findings.length?"review-required":"controls-passed",policyVersion:"PROC-DEMO-1",reviewRequired:true};
}
const offers:Offer[]=[
 {supplierId:"Dostawca A",pricePln:8200,qualityScore:90,deliveryDays:7,eligible:true},
 {supplierId:"Dostawca B",pricePln:8700,qualityScore:95,deliveryDays:4,eligible:true},
 {supplierId:"Dostawca C",pricePln:9000,qualityScore:88,deliveryDays:6,eligible:true}
];
const clean:ProcurementCase={
 id:"PROC-001",title:"Zakup podzespołów – poprawny przebieg",requestedAmountPln:8200,budgetLimitPln:10000,
 approvalsRequiredAbovePln:5000,approvedBy:"kierownik-zakupow",requesterId:"wnioskodawca-1",
 selectedSupplierId:"Dostawca A",offers,selectionCriteriaRecorded:true,conflictDeclared:false,auditTrailComplete:true,personalDataUsed:false
};
export const PROCUREMENT_DEMO_CASES:readonly ProcurementCase[]=[
 clean,
 {...clean,id:"PROC-002",title:"Przekroczenie budżetu",requestedAmountPln:12000},
 {...clean,id:"PROC-003",title:"Zakup bez wymaganego zatwierdzenia",approvedBy:null},
 {...clean,id:"PROC-004",title:"Potencjalny konflikt interesów",conflictDeclared:true},
 {...clean,id:"PROC-005",title:"Wybór oferty wymagający uzasadnienia",selectedSupplierId:"Dostawca C"},
 {...clean,id:"PROC-006",title:"Brak dokumentacji kryteriów i śladu decyzji",selectionCriteriaRecorded:false,auditTrailComplete:false},
 {...clean,id:"PROC-007",title:"Dane osobowe w procesie zakupowym",personalDataUsed:true}
];
