import {createCipheriv,createDecipheriv,randomBytes} from "node:crypto";
import type {OAuthTransaction} from "./entra-oauth-flow.ts";

const MAX_AGE_MS=5*60*1000;
function keyFromBase64(value:string):Buffer{
 const key=Buffer.from(value,"base64url");
 if(key.length!==32)throw Error("OAuth transaction encryption requires 32-byte key");
 return key;
}
export function sealOAuthTransaction(transaction:OAuthTransaction,secretBase64:string):string{
 const key=keyFromBase64(secretBase64);
 if(!Number.isSafeInteger(transaction.createdAt)||!transaction.state||!transaction.nonce||
    !/^[A-Za-z0-9_-]{43,128}$/.test(transaction.codeVerifier))
   throw Error("Invalid OAuth transaction");
 const iv=randomBytes(12);
 const cipher=createCipheriv("aes-256-gcm",key,iv);
 cipher.setAAD(Buffer.from("pamize-compliance-oauth-preview:v1"));
 const encrypted=Buffer.concat([cipher.update(JSON.stringify(transaction),"utf8"),cipher.final()]);
 return [iv.toString("base64url"),encrypted.toString("base64url"),cipher.getAuthTag().toString("base64url")].join(".");
}
export function openOAuthTransaction(sealed:string,secretBase64:string,now=Date.now()):OAuthTransaction{
 const key=keyFromBase64(secretBase64);
 if(sealed.length>4096||sealed.split(".").length!==3)throw Error("Invalid OAuth cookie envelope");
 const [ivData,data,tagData]=sealed.split(".");
 const iv=Buffer.from(ivData,"base64url"),tag=Buffer.from(tagData,"base64url");
 if(iv.length!==12||tag.length!==16)throw Error("Invalid OAuth cookie authentication data");
 const decipher=createDecipheriv("aes-256-gcm",key,iv);
 decipher.setAAD(Buffer.from("pamize-compliance-oauth-preview:v1"));
 decipher.setAuthTag(tag);
 let transaction:OAuthTransaction;
 try{transaction=JSON.parse(Buffer.concat([decipher.update(Buffer.from(data,"base64url")),decipher.final()]).toString("utf8"));}
 catch{throw Error("OAuth cookie integrity check failed");}
 if(!transaction||typeof transaction.state!=="string"||typeof transaction.nonce!=="string"||
    !/^[A-Za-z0-9_-]{43,128}$/.test(transaction.codeVerifier)||
    !Number.isSafeInteger(transaction.createdAt)||now<transaction.createdAt||
    now-transaction.createdAt>MAX_AGE_MS)
   throw Error("OAuth transaction expired or malformed");
 return transaction;
}
/** When a login route is introduced, set HttpOnly, Secure, SameSite=Lax, Path=/api/compliance/auth, Max-Age=300.
 * Delete the transaction cookie on callback regardless of success. Do not persist raw tokens. */
