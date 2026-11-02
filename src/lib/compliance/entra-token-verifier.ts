import "server-only";
import {createPublicKey,verify as verifySignature} from "node:crypto";
import type {VerifiedPrincipal,ComplianceRole} from "./assessment-authorization";

const b64=(s:string)=>Buffer.from(s,"base64url");
type Claims={aud?:string;iss?:string;tid?:string;oid?:string;sub?:string;exp?:number;nbf?:number;roles?:unknown};
type Jwk={kty:string;kid?:string;use?:string;alg?:string;n?:string;e?:string};
export type EntraVerifierConfig={tenantId:string;clientId:string;organizationMemberships:Readonly<Record<string,readonly string[]>>};

/** Fail-closed access-token verification. Requires actual Microsoft-signed tokens and
 * organization membership supplied by a trusted server-side application database.
 * No routes are exposed until authentication and membership provisioning exist. */
export async function verifyEntraAccessToken(token:string,config:EntraVerifierConfig):Promise<VerifiedPrincipal>{
 if(!/^[0-9a-f-]{36}$/i.test(config.tenantId)||!config.clientId.trim())throw Error("Invalid Entra configuration");
 if(token.length>12000||!token||token.split(".").length!==3)throw Error("Invalid JWT envelope");
 const [h,p,s]=token.split(".");
 let header:{alg?:string;kid?:string;typ?:string},claims:Claims;
 try{header=JSON.parse(b64(h).toString("utf8"));claims=JSON.parse(b64(p).toString("utf8"));}
 catch{throw Error("Invalid JWT payload");}
 if(header.alg!=="RS256"||!header.kid||header.kid.length>200)throw Error("Unsupported signature algorithm");
 const issuer=`https://login.microsoftonline.com/${config.tenantId}/v2.0`;
 const now=Math.floor(Date.now()/1000);
 if(claims.iss!==issuer||claims.tid!==config.tenantId||claims.aud!==config.clientId||
  !Number.isFinite(claims.exp)||claims.exp!<=now||claims.exp!>now+86400||
  (claims.nbf!=null&&(!Number.isFinite(claims.nbf)||claims.nbf>now+60))||
  !(claims.oid||claims.sub))throw Error("Invalid Entra claims");
 const response=await fetch(`https://login.microsoftonline.com/${config.tenantId}/discovery/v2.0/keys`,{
  signal:AbortSignal.timeout(5000),cache:"no-store"});
 if(!response.ok)throw Error("Entra signing keys unavailable");
 const contentLength=Number(response.headers.get("content-length")||0);
 if(contentLength>250000)throw Error("Signing keys response too large");
 const raw=await response.text();
 if(raw.length>250000)throw Error("Signing keys response too large");
 const json=JSON.parse(raw) as {keys?:Jwk[]};
 const key=json.keys?.find(x=>x.kid===header.kid&&x.kty==="RSA"&&x.n&&x.e&&(!x.use||x.use==="sig"));
 if(!key)throw Error("Signing key not found");
 let valid=false;
 try{valid=verifySignature("RSA-SHA256",Buffer.from(h+"."+p),createPublicKey({key:{kty:"RSA",n:key.n!,e:key.e!},format:"jwk"}),b64(s));}
 catch{throw Error("Invalid signing key");}
 if(!valid)throw Error("JWT signature verification failed");
 const subject=claims.oid||claims.sub!;
 const organizations=config.organizationMemberships[subject]||[];
 const roles:Array<ComplianceRole>=Array.isArray(claims.roles)?claims.roles.filter((r):r is ComplianceRole=>r==="author"||r==="reviewer"||r==="viewer"):[];
 return {issuer:"entra-id-verified",subject,tenantId:config.tenantId,roles,organizationIds:[...organizations]};
}
