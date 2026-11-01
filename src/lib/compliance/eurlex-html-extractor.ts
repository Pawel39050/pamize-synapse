import type { LegalProvision } from "./legal-provision-diff";

export type EurLexExtraction =
  | {ok:true; articles:LegalProvision[]; reviewRequired:true}
  | {ok:false; reason:string; reviewRequired:true};

const HEADER=/<p\b(?=[^>]*\bclass\s*=\s*["'][^"']*\bti-art\b[^"']*["'])[^>]*>([\s\S]*?)<\/p>/gi;
function plain(html:string):string{
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,"")
    .replace(/<[^>]*>/g," ")
    .replace(/&(?:nbsp|#160);/gi," ")
    .replace(/&amp;/gi,"&")
    .replace(/&lt;/gi,"<")
    .replace(/&gt;/gi,">")
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&#(\d+);/g,(_,n:string)=>{const v=Number(n);return v>0&&v<=0x10ffff?String.fromCodePoint(v):" "})
    .replace(/\s+/g," ").trim();
}
/**
 * Conservative adapter for EUR-Lex's article-heading marker ti-art.
 * This is a text-diff input, NOT proof of document authenticity or legal effect.
 * Fail closed if the provider changes markup or serves an anti-bot challenge.
 */
export function extractEurLexHtmlArticles(html:string):EurLexExtraction{
  if(html.length<100||html.length>2_000_000)
    return {ok:false,reason:"HTML size outside supported bounds",reviewRequired:true};
  if(/(?:we need to verify that you.re not a robot|enable javascript and then reload the page)/i.test(html))
    return {ok:false,reason:"Official source returned a browser verification challenge",reviewRequired:true};
  const matches=Array.from(html.matchAll(HEADER));
  if(!matches.length||matches.length>2000)
    return {ok:false,reason:"EUR-Lex article structure not recognized",reviewRequired:true};
  const articles:LegalProvision[]=[];
  const seen=new Set<string>();
  for(let i=0;i<matches.length;i++){
    const heading=plain(matches[i][1]);
    const num=/^(?:Article|Artykuł|Art\.)\s+(\d{1,4}[a-zA-Z]?)$/iu.exec(heading);
    if(!num)return {ok:false,reason:"Ambiguous article heading",reviewRequired:true};
    const identifier="Art. "+num[1];
    if(seen.has(identifier))return {ok:false,reason:"Duplicate article number",reviewRequired:true};
    seen.add(identifier);
    const start=(matches[i].index??0)+matches[i][0].length;
    const end=matches[i+1]?.index??html.length;
    const body=plain(html.slice(start,end));
    if(!body||body.length>200_000)
      return {ok:false,reason:"Empty or oversized article body",reviewRequired:true};
    articles.push({identifier,heading:null,text:body});
  }
  return {ok:true,articles,reviewRequired:true};
}
