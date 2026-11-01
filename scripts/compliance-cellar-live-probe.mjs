// One-time Preview-only probe. Never prints document contents or secrets.
if(process.env.VERCEL_ENV==="preview"&&process.env.VERCEL_GIT_COMMIT_REF==="feature/compliance-guardian"){
  const url="https://publications.europa.eu/resource/celex/32016R0679";
  try{
    let target=url;
    let res;
    for(let i=0;i<4;i++){
      res=await fetch(target,{redirect:"manual",signal:AbortSignal.timeout(12000),headers:{Accept:"application/xhtml+xml","Accept-Language":"eng"}});
      if(![301,302,303,307,308].includes(res.status))break;
      const location=res.headers.get("location");
      if(!location)throw Error("missing redirect target");
      const next=new URL(location,target);
      if(next.protocol!=="https:"||next.hostname!=="publications.europa.eu")throw Error("unapproved redirect");
      target=next.toString();
    }
    const allowed=res.status===200&&/html|xml/.test(res.headers.get("content-type")??"");
    if(!allowed){console.log("CELLAR live retrieval: BLOCKED; HTTP",res.status,"(no legal extraction attempted)");}
    else {
      const body=await res.text();
      const challenge=/verify that you.re not a robot|enable javascript and then reload/i.test(body);
      const markers=(body.match(/\bti-art\b/g)||[]).length;
      console.log("CELLAR live retrieval:",!challenge&&markers>0?"DOCUMENT_STRUCTURE_FOUND":"UNVERIFIED_FORMAT",
        "article-markers",markers,"bytes",Buffer.byteLength(body));
    }
  }catch{console.log("CELLAR live retrieval: NETWORK_OR_TIMEOUT_FAILURE");}
}
