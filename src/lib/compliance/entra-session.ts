import {createCipheriv,createDecipheriv,randomBytes} from "node:crypto";
export type ComplianceSession={subject:string;tenantId:string;roles:string[];issuedAt:number;expiresAt:number};
const context=Buffer.from("pamize-compliance-session-preview:v1");
function key(secret:string){const result=Buffer.from(secret,"base64url");if(result.length!==32)throw Error("Invalid session encryption key");return result;}
export function sealComplianceSession(session:ComplianceSession,secret:string):string{
 if(!session.subject||!session.tenantId||!Number.isSafeInteger(session.issuedAt)||
   !Number.isSafeInteger(session.expiresAt)||session.expiresAt<=session.issuedAt||
   session.expiresAt-session.issuedAt>8*60*60*1000||!Array.isArray(session.roles)||
   session.roles.some(r=>!["author","reviewer","viewer"].includes(r)))throw Error("Invalid session claims");
 const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(secret),iv);
 cipher.setAAD(context);
 const payload=Buffer.concat([cipher.update(JSON.stringify(session),"utf8"),cipher.final()]);
 return [iv.toString("base64url"),payload.toString("base64url"),cipher.getAuthTag().toString("base64url")].join(".");
}
export function openComplianceSession(value:string,secret:string,now=Date.now()):ComplianceSession{
 if(!value||value.length>4096||value.split(".").length!==3)throw Error("Invalid session cookie");
 const [a,b,c]=value.split(".");
 const iv=Buffer.from(a,"base64url"),tag=Buffer.from(c,"base64url");
 if(iv.length!==12||tag.length!==16)throw Error("Invalid session cookie");
 const decipher=createDecipheriv("aes-256-gcm",key(secret),iv);
 decipher.setAAD(context);decipher.setAuthTag(tag);
 let s:ComplianceSession;
 try{s=JSON.parse(Buffer.concat([decipher.update(Buffer.from(b,"base64url")),decipher.final()]).toString("utf8"));}
 catch{throw Error("Session authentication failed");}
 if(!s||!s.subject||!s.tenantId||!Array.isArray(s.roles)||s.roles.some(r=>!["author","reviewer","viewer"].includes(r))||
   !Number.isSafeInteger(s.issuedAt)||!Number.isSafeInteger(s.expiresAt)||
   s.issuedAt>now||s.expiresAt<=now||s.expiresAt-s.issuedAt>8*60*60*1000)throw Error("Expired or invalid session");
 return s;
}
// When wired to route: __Host- cookie requires Secure, HttpOnly, Path=/, SameSite=Lax.
// Session only asserts user identity; organization membership must be checked separately on every protected request.
