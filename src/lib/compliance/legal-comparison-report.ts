import {compareLegalProvisions,type LegalProvision,type ProvisionChange} from "./legal-provision-diff";

export type LegalComparisonReport = {
  sourceId:string;
  celex:string;
  oldVersionId:string;
  newVersionId:string;
  officialSourceUrl:string;
  generatedAt:string;
  status:"requires-legal-review";
  counts:{added:number;removed:number;modified:number};
  changes:ProvisionChange[];
};

/** Produces a factual text-diff report, never an autonomous legal determination. */
export function makeLegalComparisonReport(args:{
  sourceId:string;celex:string;oldVersionId:string;newVersionId:string;
  officialSourceUrl:string;oldArticles:readonly LegalProvision[];
  newArticles:readonly LegalProvision[];generatedAt:string;
}):LegalComparisonReport{
  if(!/^3\d{4}[RL]\d{4}$/.test(args.celex) ||
     !args.oldVersionId.trim() || !args.newVersionId.trim() ||
     args.oldVersionId===args.newVersionId) throw new Error("Two distinct identified CELEX versions required");
  const url=new URL(args.officialSourceUrl);
  if(url.protocol!=="https:" || !["eur-lex.europa.eu","publications.europa.eu"].includes(url.hostname))
    throw new Error("Official EU document URL required");
  if(Number.isNaN(Date.parse(args.generatedAt)))throw new Error("Invalid report timestamp");
  const changes=compareLegalProvisions(args.oldArticles,args.newArticles);
  return {
    sourceId:args.sourceId,celex:args.celex,oldVersionId:args.oldVersionId,
    newVersionId:args.newVersionId,officialSourceUrl:url.toString(),
    generatedAt:args.generatedAt,status:"requires-legal-review",
    counts:{
      added:changes.filter(x=>x.kind==="added").length,
      removed:changes.filter(x=>x.kind==="removed").length,
      modified:changes.filter(x=>x.kind==="modified").length
    },changes
  };
}
