import {createHash} from "node:crypto";
import type {LegalProvision} from "./legal-provision-diff";

export interface LegalActVersion {
  sourceId:string;
  celex:string;
  officialUrl:string;
  manifestationId:string;
  retrievedAt:string;
  documentSha256:string;
  articles:LegalProvision[];
  authenticity:"pending-official-verification"|"official-version-verified";
  officialVersionLabel:string|null;
}
const SHA=/^[a-f0-9]{64}$/;
export function createLegalActVersion(input:Omit<LegalActVersion,"documentSha256"|"authenticity"> & {rawDocument:Uint8Array}):LegalActVersion {
  const url=new URL(input.officialUrl);
  if(url.protocol!=="https:"||!["publications.europa.eu","eur-lex.europa.eu"].includes(url.hostname)||
     url.username||url.password)throw new Error("Official document URL required");
  if(!/^3\d{4}[RL]\d{4}$/.test(input.celex)||!input.manifestationId.trim()||
     Number.isNaN(Date.parse(input.retrievedAt))||!input.rawDocument.length||
     !input.articles.length)throw new Error("Missing or invalid version evidence");
  const documentSha256=createHash("sha256").update(input.rawDocument).digest("hex");
  return {sourceId:input.sourceId,celex:input.celex,officialUrl:url.toString(),
    manifestationId:input.manifestationId,retrievedAt:input.retrievedAt,
    documentSha256,articles:input.articles,authenticity:"pending-official-verification",
    officialVersionLabel:input.officialVersionLabel};
}
export function verifyLegalActVersion(
  version:LegalActVersion, verifiedOfficialVersionLabel:string
):LegalActVersion {
  if(!SHA.test(version.documentSha256)||!verifiedOfficialVersionLabel.trim())
    throw new Error("Official version proof required");
  return {...version,authenticity:"official-version-verified",
    officialVersionLabel:verifiedOfficialVersionLabel};
}
export function requireDistinctVerifiedVersions(a:LegalActVersion,b:LegalActVersion):void {
  if(a.authenticity!=="official-version-verified"||b.authenticity!=="official-version-verified"||
     a.celex!==b.celex||a.sourceId!==b.sourceId||
     !a.officialVersionLabel||!b.officialVersionLabel||
     a.officialVersionLabel===b.officialVersionLabel||
     a.documentSha256===b.documentSha256)
    throw new Error("Two distinct verified official legal versions required");
}
