/**
 * Authoritative public references for GDPR. These are reference identities,
 * not proof that a stored file hash corresponds to a particular manifestation.
 *
 * The consolidated version is informational; only Official Journal acts
 * and corrigenda establish authoritative published wording.
 */
export const GDPR_OFFICIAL_REFERENCES = Object.freeze({
  celex: "32016R0679",
  officialJournal: "OJ L 119, 4 May 2016, pp. 1–88",
  originalEli: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
  originalPublicationDate: "2016-05-04",
  consolidatedCelex: "02016R0679-20160504",
  consolidatedReference: "https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:02016R0679-20160504",
  consolidatedHasLegalForce: false,
  knownCorrigenda: [
    {oj:"OJ L 127, 23 May 2018, p. 2", status:"requires-document-verification"},
    {oj:"OJ L 74, 4 March 2021, p. 35", status:"requires-document-verification"}
  ]
});
export function assessStoredGdprVersionIdentity(row:{
  celex:string;documentSha256:string;manifestationId:string;officialVersionLabel:string|null;
}):{status:"requires-manifestation-verification";officialReference:string;reason:string}{
  if(row.celex!==GDPR_OFFICIAL_REFERENCES.celex||!/^[a-f0-9]{64}$/.test(row.documentSha256))
    throw new Error("Not a valid GDPR version evidence record");
  return {
    status:"requires-manifestation-verification",
    officialReference:GDPR_OFFICIAL_REFERENCES.originalEli,
    reason:"CELEX and page structure do not independently establish exact fetched manifestation, language or corrigendum state"
  };
}
