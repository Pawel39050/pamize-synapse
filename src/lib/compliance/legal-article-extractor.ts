import type { LegalProvision } from "./legal-provision-diff";

export type ArticleExtraction =
  | {ok:true; articles:LegalProvision[]; reviewRequired:true}
  | {ok:false; reason:string; reviewRequired:true};

/**
 * Conservative extractor for *already plain-text* versions of legal acts.
 * Do NOT pass raw HTML: HTML flattening requires a separately verified parser.
 * Matching is deliberately restricted to standalone Article / Artykuł / Art.
 * headings followed by a number. This is NOT authoritative legal parsing.
 */
export function extractNumberedArticles(plainText:string):ArticleExtraction {
  if(plainText.length>2_000_000 || plainText.length<20)
    return {ok:false,reason:"Document size outside safe extraction bounds",reviewRequired:true};
  if(/<\s*(?:html|body|script|article|div|p)\b/i.test(plainText))
    return {ok:false,reason:"Raw HTML is not supported by this plain-text parser",reviewRequired:true};
  const normalized=plainText.replace(/\r\n?/g,"\n").normalize("NFC");
  const lines=normalized.split("\n");
  const header=/^\s*(?:Article|Artykuł|Art\.)\s+(\d{1,4}[a-zA-Z]?)\s*\.?\s*$/iu;
  const headers:{index:number;id:string}[]=[];
  for(let i=0;i<lines.length;i++){
    const match=lines[i].match(header);
    if(match)headers.push({index:i,id:match[1]});
  }
  if(!headers.length || headers.length>2000)
    return {ok:false,reason:"No unambiguous article headings found",reviewRequired:true};
  const articles:LegalProvision[]=[];
  const seen=new Set<string>();
  for(let i=0;i<headers.length;i++){
    const current=headers[i],next=headers[i+1];
    const id="Art. "+current.id;
    if(seen.has(id))return {ok:false,reason:"Duplicate article heading",reviewRequired:true};
    seen.add(id);
    const linesOfArticle=lines.slice(current.index+1,next?.index??lines.length);
    const text=linesOfArticle.join("\n").trim();
    if(!text || text.length>200_000)
      return {ok:false,reason:"Empty or excessive article text",reviewRequired:true};
    articles.push({identifier:id,heading:null,text});
  }
  return {ok:true,articles,reviewRequired:true};
}
