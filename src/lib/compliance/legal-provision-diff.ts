import { createHash } from "node:crypto";

/**
 * Deterministic article-level comparison of already extracted legal provisions.
 * Extraction and authoritative-version verification must happen upstream.
 * This module makes NO legal-effect or applicability determination.
 */
export interface LegalProvision {
  identifier: string;
  heading: string | null;
  text: string;
}
export type ProvisionChange =
  | {kind:"added"; identifier:string; current:LegalProvision}
  | {kind:"removed"; identifier:string; previous:LegalProvision}
  | {kind:"modified"; identifier:string; previous:LegalProvision; current:LegalProvision};

const MAX_PROVISIONS = 2000;
const MAX_TEXT_LENGTH = 200_000;
const SAFE_IDENTIFIER = /^[\p{L}\p{N}][\p{L}\p{N} .()\/-]{0,99}$/u;
const normalized = (text:string) => text.normalize("NFC").replace(/\s+/gu," ").trim();
const fingerprint = (provision:LegalProvision) => createHash("sha256")
  .update(normalized(provision.heading ?? "") + "\n" + normalized(provision.text)).digest("hex");

function indexProvisions(provisions:readonly LegalProvision[]):Map<string,LegalProvision>{
  if (provisions.length > MAX_PROVISIONS) throw new Error("Too many provisions");
  const indexed = new Map<string,LegalProvision>();
  for(const p of provisions){
    const key=normalized(p.identifier);
    if(!SAFE_IDENTIFIER.test(key) || !p.text.trim() || p.text.length>MAX_TEXT_LENGTH)
      throw new Error("Invalid provision identifier or text");
    if(indexed.has(key)) throw new Error("Duplicate provision identifier");
    indexed.set(key,p);
  }
  return indexed;
}

/** Compare only two already verified representations of the same legal act. */
export function compareLegalProvisions(
  previous:readonly LegalProvision[],
  current:readonly LegalProvision[]
):ProvisionChange[]{
  const oldIndex=indexProvisions(previous);
  const newIndex=indexProvisions(current);
  const changes:ProvisionChange[]=[];
  for(const [identifier,prev] of oldIndex){
    const next=newIndex.get(identifier);
    if(!next) changes.push({kind:"removed",identifier,previous:prev});
    else if(fingerprint(prev)!==fingerprint(next))
      changes.push({kind:"modified",identifier,previous:prev,current:next});
  }
  for(const [identifier,next] of newIndex){
    if(!oldIndex.has(identifier)) changes.push({kind:"added",identifier,current:next});
  }
  return changes.sort((a,b)=>a.identifier.localeCompare(b.identifier,"pl"));
}
