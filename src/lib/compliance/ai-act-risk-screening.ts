export type ScreeningAnswer="yes"|"no"|"unknown";
export type AiActScreeningInput={
 prohibitedPractice:ScreeningAnswer;
 annexIIIContext:ScreeningAnswer;
 safetyComponent:ScreeningAnswer;
 directlyInteractsWithPeople:ScreeningAnswer;
};
export type AiActScreening={status:"priority-legal-review"|"high-risk-screening"|"transparency-review"|"classification-incomplete";reasons:string[];references:string[];reviewRequired:true;};
export const AI_ACT_OFFICIAL_SOURCE="https://eur-lex.europa.eu/eli/reg/2024/1689";
export function screenAiActRisk(input:AiActScreeningInput):AiActScreening{
 const values=Object.values(input);
 if(values.some(value=>!["yes","no","unknown"].includes(value)))throw Error("Invalid screening answer");
 const reasons:string[]=[];
 const references:string[]=[];
 const add=(article:string,reason:string)=>{references.push(article);reasons.push(reason)};
 if(input.prohibitedPractice==="yes"){
  add("Art. 5","Zgłoszono możliwy przypadek praktyki zakazanej. Wstrzymaj decyzję o wdrożeniu i przekaż do pilnej analizy prawnej; odpowiedź nie rozstrzyga o zakazie.");
  return {status:"priority-legal-review",reasons,references,reviewRequired:true};
 }
 if(input.prohibitedPractice==="unknown")add("Art. 5","Nie wykluczono praktyk zakazanych.");
 if(input.annexIIIContext==="yes")add("Art. 6 i załącznik III","Zastosowanie może podlegać ocenie systemu wysokiego ryzyka; należy zweryfikować wyjątki i profilowanie.");
 if(input.safetyComponent==="yes")add("Art. 6 i załącznik I","Możliwa kwalifikacja jako komponent bezpieczeństwa produktu wymaga odrębnego badania.");
 if(input.directlyInteractsWithPeople==="yes")add("Art. 50","Zweryfikuj obowiązki przejrzystości przy bezpośredniej interakcji z osobami.");
 if(input.annexIIIContext==="unknown"||input.safetyComponent==="unknown")
  add("Art. 6","Brak danych do wykluczenia obszarów wysokiego ryzyka.");
 if(input.directlyInteractsWithPeople==="unknown")add("Art. 50","Nie ustalono, czy system bezpośrednio komunikuje się z osobami.");
 if(input.annexIIIContext==="yes"||input.safetyComponent==="yes")
  return {status:"high-risk-screening",reasons,references,reviewRequired:true};
 if(input.directlyInteractsWithPeople==="yes"&&input.prohibitedPractice==="no"&&input.annexIIIContext==="no"&&input.safetyComponent==="no")
  return {status:"transparency-review",reasons,references,reviewRequired:true};
 if(reasons.length===0)add("Art. 5, 6 i 50","Brak zgłoszonych przesłanek z pytań przesiewowych nie dowodzi, że system jest zgodny lub nie należy do kategorii wysokiego ryzyka.");
 return {status:"classification-incomplete",reasons,references,reviewRequired:true};
}
