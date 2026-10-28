import "server-only";
import {XMLParser,XMLValidator} from "fast-xml-parser";
import type {HunterCategory} from "./talent-hunter";

export const KPRM_XML="https://nabory.kprm.gov.pl/pls/serwis/app.xml";
export const SOURCE_KEY="kprm-xml";
const MAX_BYTES=9_000_000;
const MAX_ENTRIES=30;
const KPRM_LINK=/https:\/\/nabory\.kprm\.gov\.pl\/[\w%+.,\-\/]+,([0-9]{4,}),v[0-9]+/i;
const PZP=/zam[oó]wie[nń](?:ia|ień|niami)?\s+publiczn|przetarg|prawo\s+zam[oó]wie[nń]|\bswz\b/i;
const BUY=/\bzakup(?:y|ów|owe|ach)?\b|zaopatrzen|\blogistyk|dostawc|sourcing/i;
export type ScannedJob={
  sourceKey:typeof SOURCE_KEY;externalId:string;sourceUrl:string;
  title:string;company:string;location:string;category:HunterCategory;
  excerpt:string;publishedAt:string|null;
};
export type SourceScan={found:number;matched:number;jobs:ScannedJob[]};
const clean=(text:string)=>text.replace(/<[^>]*>/g," ").replace(/&(?:nbsp|#160);/gi," ").replace(/\s+/g," ").trim();
function fields(node:unknown,max=130):Array<{path:string;value:string}>{
  const items:Array<{path:string;value:string}>=[];
  function go(value:unknown,path:string,depth:number){
    if(items.length>=max||depth>8)return;
    if(typeof value==="string"||typeof value==="number"){
      const text=clean(String(value));
      if(text)items.push({path,value:text.slice(0,18000)});
    }else if(Array.isArray(value)){
      for(const item of value.slice(0,35))go(item,path,depth+1);
    }else if(value&&typeof value==="object"){
      for(const [key,sub] of Object.entries(value).slice(0,70))go(sub,path?path+"."+key:key,depth+1);
    }
  }
  go(node,"",0);return items;
}
function extractByKeys(leaves:Array<{path:string;value:string}>,pattern:RegExp,min=1,max=260):string{
  return leaves.filter(x=>pattern.test(x.path)&&x.value.length>=min&&x.value.length<=max)
    .sort((a,b)=>a.path.length-b.path.length)[0]?.value??"";
}
function canonical(link:string):{url:string;id:string}|null{
  const normalized=link.replace(/&amp;/g,"&").trim();
  const match=normalized.match(KPRM_LINK);
  if(!match)return null;
  const url=match[0];
  try{
    const parsed=new URL(url);
    if(parsed.hostname!=="nabory.kprm.gov.pl"||parsed.protocol!=="https:"||url.length>1200)return null;
    return {url,id:match[1]};
  }catch{return null;}
}
export function parseKprmXml(xml:string):SourceScan{
  if(xml.length>MAX_BYTES)throw new Error("source_too_large");
  if(XMLValidator.validate(xml)!==true)throw new Error("invalid_source_xml");
  const parser=new XMLParser({ignoreAttributes:false,removeNSPrefix:true,parseTagValue:false,
    trimValues:true,processEntities:false,numberParseOptions:{hex:false,leadingZeros:false}});
  const root:unknown=parser.parse(xml);
  const found=new Map<string,ScannedJob>();
  let examined=0;
  const visit=(node:unknown,depth:number)=>{
    if(depth>12||examined>25_000||!node)return;
    if(Array.isArray(node)){for(const x of node.slice(0,1400))visit(x,depth+1);return;}
    if(typeof node!=="object")return;
    examined++;
    const leaves=fields(node);
    // Only a single offer per entry. Never mistake a feed-level parent for one vacancy.
    const urls=[...new Set(leaves.flatMap(x=>{
      const item=canonical(x.value);return item?[item.url]:[];
    }))];
    if(urls.length===1&&leaves.length>=5){
      const link=canonical(urls[0])!;
      const title=extractByKeys(leaves,/(^|\.)(stanowisko|nazwa_stanowiska|job_title|tytul|title|stanowisko_pracy)$/i,5,220)||
        extractByKeys(leaves,/(stanowisk|position)/i,5,220);
      const company=extractByKeys(leaves,/(^|\.)(nazwa_urzedu|urzad|urząd|nazwa_jednostki|pracodawca|employer|instytucja)$/i,4,220)||
        extractByKeys(leaves,/(nazwa.*urz|jednostka|organ.*nabor)/i,4,220);
      const location=extractByKeys(leaves,/(^|\.)(miejscowosc|miejscowość|miasto|lokalizacja)$/i,2,140)||
        extractByKeys(leaves,/(miasto|miejscow)/i,2,140);
      const obligations=leaves.filter(x=>/(zadani|zakres.*prac|obowi[aą]zk|opis.*stanowisk|wykonuj)/i.test(x.path))
        .map(x=>x.value).filter(x=>x.length>=40);
      const excerpt=obligations.join("\n").slice(0,16000);
      const context=[title,excerpt,...leaves.filter(x=>x.value.length<150).slice(0,12).map(x=>x.value)].join(" ");
      const category:HunterCategory|null=PZP.test(context)?"pzp":BUY.test(context)?"zakupy":null;
      if(title&&company&&category&&excerpt.length>=80){
        const next:ScannedJob={sourceKey:SOURCE_KEY,externalId:link.id,sourceUrl:link.url,
          title,company,location,category,excerpt,publishedAt:null};
        const existing=found.get(link.id);
        if(!existing||next.excerpt.length>existing.excerpt.length)found.set(link.id,next);
      }
    }
    for(const val of Object.values(node))if(val&&typeof val==="object")visit(val,depth+1);
  };
  visit(root,0);
  const jobs=[...found.values()].slice(0,MAX_ENTRIES);
  return {found:examined,matched:found.size,jobs};
}
export async function fetchKprmJobs():Promise<SourceScan>{
  const response=await fetch(KPRM_XML,{headers:{Accept:"application/xml,text/xml;q=0.9","User-Agent":"PAMIZE-TalentHunter/1.1 (low-frequency public-data discovery)"},
    cache:"no-store",signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error("source_http_"+response.status);
  const declared=Number(response.headers.get("content-length")??0);
  if(declared>MAX_BYTES)throw new Error("source_too_large");
  if(!response.body)throw new Error("source_empty");
  const reader=response.body.getReader();
  const chunks:Uint8Array[]=[];let size=0;
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      size+=value.byteLength;
      if(size>MAX_BYTES){await reader.cancel();throw new Error("source_too_large");}
      chunks.push(value);
    }
  }finally{reader.releaseLock();}
  const xml=new TextDecoder("utf-8").decode(Buffer.concat(chunks));
  return parseKprmXml(xml);
}
