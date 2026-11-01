import "server-only";
import {createHash} from "node:crypto";

/**
 * Official Publications Office CELLAR retrieval by fixed CELEX identifier.
 * No untrusted URLs or redirects. Results require source/version review.
 * This is independent from the existing UODO scheduler and does not persist.
 */
const ACTS:Record<string,string>={
  "eu-gdpr":"32016R0679",
  "eu-ai-act":"32024R1689",
  "eu-nis2":"32022L2555",
  "eu-dora":"32022R2554"
};
const LIMIT=3*1024*1024;
export type CellarResult=
  |{ok:true;sourceId:string;celex:string;sourceUrl:string;sha256:string;retrievedAt:string;contentType:string;body:string;verified:false}
  |{ok:false;sourceId:string;reason:string};

export async function fetchOfficialCellarAct(sourceId:string,language:"EN"|"PL"="EN"):Promise<CellarResult>{
  const celex=ACTS[sourceId];
  if(!celex)return {ok:false,sourceId,reason:"Not an allowlisted EU act"};
  const url=`https://publications.europa.eu/resource/celex/${celex}`;
  try{
    const response=await fetch(url,{
      redirect:"manual",cache:"no-store",signal:AbortSignal.timeout(15000),
      headers:{Accept:"application/xhtml+xml", "Accept-Language":language==="PL"?"pl":"en"}
    });
    if(!response.ok||!response.body)
      return {ok:false,sourceId,reason:`Cellar HTTP ${response.status} (redirects not followed)`};
    const contentType=(response.headers.get("content-type")??"").split(";")[0].trim().toLowerCase();
    if(!["application/xhtml+xml","text/html","application/xml","text/xml"].includes(contentType)){
      await response.body.cancel();
      return {ok:false,sourceId,reason:"Unexpected CELLAR content type"};
    }
    const announced=Number(response.headers.get("content-length"));
    if(announced>LIMIT){await response.body.cancel();return {ok:false,sourceId,reason:"Document too large"};}
    const reader=response.body.getReader();let size=0;const chunks:Uint8Array[]=[];
    try{
      while(true){
        const {done,value}=await reader.read();if(done)break;
        size+=value.byteLength;
        if(size>LIMIT){await reader.cancel();return {ok:false,sourceId,reason:"Document too large"};}
        chunks.push(value);
      }
    }finally{reader.releaseLock();}
    const bytes=Buffer.concat(chunks);
    const body=new TextDecoder("utf-8").decode(bytes);
    if(/we need to verify that you.re not a robot|enable javascript and then reload the page/i.test(body))
      return {ok:false,sourceId,reason:"Provider returned a verification challenge"};
    return {ok:true,sourceId,celex,sourceUrl:url,sha256:createHash("sha256").update(bytes).digest("hex"),
      retrievedAt:new Date().toISOString(),contentType,body,verified:false};
  }catch{return {ok:false,sourceId,reason:"Cellar request failed or timed out"};}
}
