import "server-only";
import {XMLParser,XMLValidator} from "fast-xml-parser";
import type {HunterCategory} from "./talent-hunter";

export const KPRM_XML="https://nabory.kprm.gov.pl/pls/serwis/app.xml";
export const SOURCE_KEY="kprm-xml";
const MAX_BYTES=9_000_000;
const MAX_ENTRIES=30;
const LINK=/https:\/\/nabory\.kprm\.gov\.pl\/[\p{L}\p{N}%+.,\-_\/]+?,([0-9]{4,}),v[0-9]+\b/iu;
const PZP=/zam[oó]wie[nń](?:ia|ień|niami)?\s+publiczn|przetarg|prawo\s+zam[oó]wie[nń]|\bswz\b/i;
const BUY=/\bzakup(?:y|ów|owe|ach)?\b|zaopatrzen|\blogistyk|dostawc|sourcing/i;
const DUTY=/\b(?:prowadzi|prowadz|przygotow|sporządz|analizuj|analiz|realizuj|realiz|koordynuj|udziel|uczestnicz|opracowuj|wykonuj|nadzoruj|monitoruj|obsługuj|ewidencjonuj|rejestruj)\w*/i;
export type ScannedJob={
  sourceKey:typeof SOURCE_KEY;externalId:string;sourceUrl:string;
  title:string;company:string;location:string;category:HunterCategory;
  excerpt:string;publishedAt:string|null;
};
export type ScanDiagnostics={elements:number;nodesWithLinks:number;missingTitle:number;
  missingCompany:number;missingDuties:number;notRelevant:number;rootKeys:string[];sampleEntryKeys:string[]};
export type SourceScan={found:number;matched:number;jobs:ScannedJob[];diagnostics:ScanDiagnostics};
type Leaf={path:string;value:string};
const clean=(text:string)=>text.replace(/<[^>]*>/g," ").replace(/&(?:nbsp|#160);/gi," ").replace(/\s+/g," ").trim();
function leavesOf(node:unknown,max=420):Leaf[]{
  const items:Leaf[]=[];
  function go(value:unknown,path:string,depth:number){
    if(items.length>=max||depth>12)return;
    if(typeof value==="string"||typeof value==="number"){
      const val=clean(String(value));
      if(val)items.push({path,value:val.slice(0,18000)});
    }else if(Array.isArray(value)){
      for(const x of value.slice(0,100))go(x,path,depth+1);
    }else if(value&&typeof value==="object"){
      for(const [key,sub] of Object.entries(value).slice(0,110))go(sub,path?path+"."+key:key,depth+1);
    }
  }
  go(node,"",0);return items;
}
function byKey(leaves:Leaf[],re:RegExp,min=1,max=250):string{
  return leaves.find(x=>re.test(x.path)&&x.value.length>=min&&x.value.length<=max)?.value??"";
}
function canonical(raw:string):{url:string;id:string}|null{
  const match=raw.replace(/&amp;/g,"&").match(LINK);
  if(!match)return null;
  try{
    const parsed=new URL(match[0]);
    if(parsed.hostname!=="nabory.kprm.gov.pl"||parsed.protocol!=="https:"||parsed.href.length>1200)return null;
    return {id:match[1],url:parsed.href};
  }catch{return null;}
}
function detectCategory(shortText:string,description:string):HunterCategory|null{
  const context=shortText+" "+description.slice(0,5000);
  if(PZP.test(context))return "pzp";
  if(BUY.test(context))return "zakupy";
  return null;
}
function excerptOf(leaves:Leaf[]):string{
  const selected=leaves.filter(x=>
    /(zadani|zakres.{0,15}(prac|czynno)|obowi[aą]zk|opis.{0,15}stanowisk|czynno.sci|wykonuj|co.b[eę]dziesz)/i.test(x.path)
    &&x.value.length>=20&&x.value.length<=16000
  ).map(x=>x.value);
  if(selected.length)return [...new Set(selected)].join("\n").slice(0,16000);
  // Some KPRM feed versions keep the entire narrative in one unnamed CDATA field.
  // Select text describing actual job duties, not requirements, privacy notices or applicant instructions.
  const fallback=leaves
    .filter(x=>x.value.length>=60&&x.value.length<=12000&&DUTY.test(x.value)&&
      !/(^|\.)(wymagan|dokument|o.swiadczen|klauzul|rodo|informacj.{0,10}dodatk)/i.test(x.path))
    .sort((a,b)=>a.value.length-b.value.length)
    .map(x=>x.value);
  return fallback[0]?.slice(0,16000)??"";
}
function chooseCompany(leaves:Leaf[]):string{
  const named=byKey(leaves,/(urz[aą]d|urz[eę]du|nazwa_urzedu|jednostk|pracodawc|instytucj|ministerstw|organ_rekrut)/i,4,220);
  if(named)return named;
  return leaves.find(x=>x.value.length<220&&/(?:^|\b)(?:Urząd|Ministerstwo|Inspektorat|Komenda|Izba|Wojewódzki)\b/i.test(x.value))?.value??"";
}
function chooseTitle(leaves:Leaf[]):string{
  return byKey(leaves,/(stanowisk|job.title|tytu[lł]|position|nazwa_posady)/i,4,220)||
    byKey(leaves,/(^|\.)(nazwa|name|funkcja|specjalizacj)/i,4,220);
}
function chooseLocation(leaves:Leaf[]):string{
  return byKey(leaves,/(miejscow|miasto|lokalizacj|miejsce.prac)/i,2,140);
}
export function parseKprmXml(xml:string):SourceScan{
  if(xml.length>MAX_BYTES)throw new Error("source_too_large");
  if(XMLValidator.validate(xml)!==true)throw new Error("invalid_source_xml");
  const parser=new XMLParser({ignoreAttributes:false,removeNSPrefix:true,parseTagValue:false,
    trimValues:true,processEntities:false,numberParseOptions:{hex:false,leadingZeros:false}});
  const root:unknown=parser.parse(xml);
  const diagnostics:ScanDiagnostics={elements:0,nodesWithLinks:0,missingTitle:0,
    missingCompany:0,missingDuties:0,notRelevant:0,
    rootKeys:root&&typeof root==="object"&&!Array.isArray(root)?Object.keys(root).slice(0,12):[],
    sampleEntryKeys:[]};
  const found=new Map<string,ScannedJob>();
  // Search nested XML objects. Accept only candidates with a single canonical vacancy URL.
  // Multiple pages of one feed must not be conflated into a single job.
  function visit(node:unknown,depth:number){
    if(depth>15||diagnostics.elements>40000||!node)return;
    if(Array.isArray(node)){
      for(const x of node.slice(0,1800))visit(x,depth+1);
      return;
    }
    if(typeof node!=="object")return;
    diagnostics.elements++;
    const leaves=leavesOf(node);
    const links=new Map<string,{id:string;url:string}>();
    for(const leaf of leaves){const url=canonical(leaf.value);if(url)links.set(url.id,url);}
    if(links.size===1&&leaves.length>=3){
      diagnostics.nodesWithLinks++;
      if(!diagnostics.sampleEntryKeys.length)diagnostics.sampleEntryKeys=Object.keys(node).slice(0,35);
      const link=[...links.values()][0];
      const title=chooseTitle(leaves),company=chooseCompany(leaves),excerpt=excerptOf(leaves);
      const location=chooseLocation(leaves);
      const category=detectCategory(leaves.filter(x=>x.value.length<=180).slice(0,26).map(x=>x.value).join(" "),excerpt);
      if(!title)diagnostics.missingTitle++;
      if(!company)diagnostics.missingCompany++;
      if(excerpt.length<40)diagnostics.missingDuties++;
      if(!category)diagnostics.notRelevant++;
      if(title&&company&&category&&excerpt.length>=40){
        const next:ScannedJob={sourceKey:SOURCE_KEY,externalId:link.id,sourceUrl:link.url,
          title:title.slice(0,220),company:company.slice(0,220),location:location.slice(0,140),
          category,excerpt:excerpt.slice(0,16000),publishedAt:null};
        const prior=found.get(link.id);
        if(!prior||next.excerpt.length>prior.excerpt.length)found.set(link.id,next);
      }
    }
    for(const value of Object.values(node))if(value&&typeof value==="object")visit(value,depth+1);
  }
  visit(root,0);
  return {found:diagnostics.elements,matched:found.size,jobs:[...found.values()].slice(0,MAX_ENTRIES),diagnostics};
}
export async function fetchKprmJobs():Promise<SourceScan>{
  const response=await fetch(KPRM_XML,{
    headers:{Accept:"application/xml,text/xml;q=0.9","User-Agent":"PAMIZE-TalentHunter/1.1 (low-frequency public-data discovery)"},
    cache:"no-store",signal:AbortSignal.timeout(20000)
  });
  if(!response.ok)throw new Error("source_http_"+response.status);
  const declared=Number(response.headers.get("content-length")??0);
  if(declared>MAX_BYTES)throw new Error("source_too_large");
  if(!response.body)throw new Error("source_empty");
  const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
  try{
    while(true){
      const {done,value}=await reader.read();if(done)break;
      size+=value.byteLength;
      if(size>MAX_BYTES){await reader.cancel();throw new Error("source_too_large");}
      chunks.push(value);
    }
  }finally{reader.releaseLock();}
  return parseKprmXml(new TextDecoder("utf-8").decode(Buffer.concat(chunks)));
}
