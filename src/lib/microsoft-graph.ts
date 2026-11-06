// Read-only Microsoft Graph delegated integration for a single PAMIZE owner.
// Tokens are never returned to the browser or committed to source control.
// MVP session: an AES-256-GCM sealed, HttpOnly SameSite=Lax refresh-token cookie.
// For multi-user/customer deployments replace sealed cookie sessions with a server-side session store.
import "server-only";
import {createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual} from "node:crypto";
import type {NextResponse} from "next/server";

export const MICROSOFT_CALLBACK = "https://pamize-synapse.vercel.app/api/microsoft/callback";
export const TX_COOKIE = "synapse_ms_oauth";
export const SESSION_COOKIE = "synapse_ms_session";
const MICROSOFT_IDENTITY = "https://login.microsoftonline.com/consumers/oauth2/v2.0";
const GRAPH_ROOT = "https://graph.microsoft.com/v1.0";
const SCOPES = "openid profile email offline_access User.Read Files.Read";
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const MAX_COOKIE_LENGTH = 3700;

export class MicrosoftIntegrationError extends Error {
  constructor(public readonly kind:string,public readonly status:number,public readonly code:string) {
    super(kind+" ["+status+"] "+code);
    this.name="MicrosoftIntegrationError";
  }
}
export type AuthTransaction = {state:string; verifier:string; createdAt:number};
export type MicrosoftSession = {refreshToken:string; id:string; email:string; createdAt:number};
export type GraphItem = {
  id:string; name:string; webUrl?:string;
  folder?:{childCount?:number}; file?:{mimeType?:string};
  lastModifiedDateTime?:string;
};
type TokenResponse = {
  access_token?:string; refresh_token?:string; expires_in?:number;
  error?:string; error_description?:string;
};

export function microsoftConfigured(): boolean {
  return Boolean(
    process.env.MICROSOFT_CLIENT_ID &&
    process.env.MICROSOFT_CLIENT_SECRET &&
    process.env.MICROSOFT_ALLOWED_EMAIL &&
    process.env.MICROSOFT_SESSION_SECRET &&
    process.env.MICROSOFT_SESSION_SECRET.length >= 32
  );
}

function key():Buffer {
  const secret = process.env.MICROSOFT_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Microsoft session secret is not configured.");
  return createHash("sha256").update(secret,"utf8").digest();
}

export function seal(data:unknown):string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm",key(),iv);
  cipher.setAAD(Buffer.from("pamize-microsoft-v1"));
  const payload = Buffer.concat([cipher.update(JSON.stringify(data),"utf8"),cipher.final()]);
  const token = "v1." + Buffer.concat([iv,cipher.getAuthTag(),payload]).toString("base64url");
  if (token.length > MAX_COOKIE_LENGTH) throw new Error("Microsoft session exceeds cookie limit; use a server-side store.");
  return token;
}

export function unseal<T>(value:string|undefined):T|null {
  if (!value || !value.startsWith("v1.")) return null;
  try {
    const bytes=Buffer.from(value.slice(3),"base64url");
    if (bytes.length < 29) return null;
    const decipher=createDecipheriv("aes-256-gcm",key(),bytes.subarray(0,12));
    decipher.setAAD(Buffer.from("pamize-microsoft-v1"));
    decipher.setAuthTag(bytes.subarray(12,28));
    return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString("utf8")) as T;
  } catch { return null; }
}

export function secureCookie(res:NextResponse,name:string,value:string,maxAge:number) {
  res.cookies.set(name,value,{httpOnly:true,secure:true,sameSite:"lax",path:"/api/microsoft",maxAge});
}
export function clearCookie(res:NextResponse,name:string) {
  res.cookies.set(name,"",{httpOnly:true,secure:true,sameSite:"lax",path:"/api/microsoft",maxAge:0});
}
export function markPrivate(res:NextResponse) {
  res.headers.set("Cache-Control","no-store, private");
  res.headers.set("Pragma","no-cache");
  res.headers.set("X-Content-Type-Options","nosniff");
  return res;
}
export function safeEqual(a:string,b:string):boolean {
  const aa=Buffer.from(a,"utf8"),bb=Buffer.from(b,"utf8");
  return aa.length===bb.length && timingSafeEqual(aa,bb);
}
export function randomUrlToken(bytes=32):string{return randomBytes(bytes).toString("base64url");}
export function pkceChallenge(verifier:string):string{return createHash("sha256").update(verifier).digest("base64url");}

export function microsoftAuthorizeUrl(state:string,challenge:string):string {
  const params=new URLSearchParams({
    client_id:process.env.MICROSOFT_CLIENT_ID!,
    response_type:"code",redirect_uri:MICROSOFT_CALLBACK,
    response_mode:"query",scope:SCOPES,
    state,code_challenge:challenge,code_challenge_method:"S256",
    prompt:"select_account"
  });
  return `${MICROSOFT_IDENTITY}/authorize?${params.toString()}`;
}
async function exchange(body:URLSearchParams):Promise<TokenResponse> {
  const res=await fetch(`${MICROSOFT_IDENTITY}/token`,{
    method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body,cache:"no-store",signal:AbortSignal.timeout(12000)
  });
  const json=await res.json() as TokenResponse;
  if (!res.ok || !json.access_token) {
    // Avoid logging raw OAuth payloads or account identifiers.
    throw new MicrosoftIntegrationError("token_request",res.status,json.error??"oauth_failed");
  }
  return json;
}
function tokenParams():URLSearchParams {
  return new URLSearchParams({
    client_id:process.env.MICROSOFT_CLIENT_ID!,
    client_secret:process.env.MICROSOFT_CLIENT_SECRET!,
    redirect_uri:MICROSOFT_CALLBACK,
    scope:SCOPES
  });
}
export async function exchangeCode(code:string,verifier:string):Promise<TokenResponse>{
  const params=tokenParams();
  params.set("grant_type","authorization_code");
  params.set("code",code);params.set("code_verifier",verifier);
  return exchange(params);
}
export async function refreshAccessToken(refreshToken:string):Promise<TokenResponse>{
  const params=tokenParams();
  params.set("grant_type","refresh_token");
  params.set("refresh_token",refreshToken);
  return exchange(params);
}
export async function microsoftGraph<T>(accessToken:string,path:string):Promise<T>{
  const url=new URL(path,GRAPH_ROOT+"/");
  if (url.protocol!=="https:" || url.hostname!=="graph.microsoft.com" || !url.pathname.startsWith("/v1.0/"))
    throw new Error("Blocked unsafe Microsoft Graph endpoint.");
  const res=await fetch(url.toString(),{headers:{Authorization:`Bearer ${accessToken}`,Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(12000)});
  if (!res.ok) {
    // Only expose HTTP status and Graph error code; never user data or tokens.
    let graphCode="graph_failed";
    try {
      const payload=await res.json() as {error?:{code?:string}};
      const candidate=payload?.error?.code;
      if(typeof candidate==="string" && /^[a-zA-Z0-9_.-]{1,80}$/.test(candidate))graphCode=candidate;
    } catch { /* Graph can return a non-JSON error. */ }
    throw new MicrosoftIntegrationError("graph_request",res.status,graphCode);
  }
  return await res.json() as T;
}
export async function microsoftProfile(accessToken:string):Promise<{id:string;displayName?:string;mail?:string|null;userPrincipalName?:string|null}>{
  return microsoftGraph(accessToken,"/v1.0/me?$select=id,displayName,mail,userPrincipalName");
}
export function isAllowedProfile(profile:{mail?:string|null;userPrincipalName?:string|null}):boolean {
  const expected=(process.env.MICROSOFT_ALLOWED_EMAIL||"").trim().toLocaleLowerCase("en-US");
  if (!expected) return false;
  return [profile.mail,profile.userPrincipalName].some(candidate=>candidate?.trim().toLocaleLowerCase("en-US")===expected);
}
export async function graphChildren(accessToken:string,path:string):Promise<GraphItem[]> {
  // Resolve the absolute Graph path once. GRAPH_ROOT already contains /v1.0;
  // concatenating both strings duplicated the API version and caused HTTP 400 BadRequest.
  let next:string|null=new URL(path,GRAPH_ROOT+"/").toString();
  const all:GraphItem[]=[];
  for(let page=0;next && page<5;page++){
    const current:string=next;
    const data:{value:GraphItem[];"@odata.nextLink"?:string}=await microsoftGraph(accessToken,current);
    if(!Array.isArray(data.value))throw new MicrosoftIntegrationError("graph_response",502,"invalid_items");
    all.push(...data.value);
    next=data["@odata.nextLink"]??null;
    if (all.length>600) throw new Error("Graph listing too large for the single-owner MVP.");
  }
  if(next) throw new Error("Graph pagination limit reached; no partial catalog returned.");
  return all;
}
export function makeSession(profile:{id:string;mail?:string|null;userPrincipalName?:string|null},refreshToken:string):MicrosoftSession {
  const expected=(process.env.MICROSOFT_ALLOWED_EMAIL||"").trim().toLocaleLowerCase("en-US");
  const confirmed=[profile.mail,profile.userPrincipalName].find(candidate=>candidate?.trim().toLocaleLowerCase("en-US")===expected);
  if (!confirmed) throw new Error("Account identity mismatch.");
  return {id:profile.id,email:confirmed.trim(),refreshToken,createdAt:Date.now()};
}
export function isValidSession(session:MicrosoftSession|null):session is MicrosoftSession {
  return Boolean(session && typeof session.refreshToken==="string" && session.refreshToken.length>10 && typeof session.email==="string" && session.email.toLocaleLowerCase("en-US")===(process.env.MICROSOFT_ALLOWED_EMAIL||"").toLocaleLowerCase("en-US") && session.createdAt>Date.now()-SESSION_SECONDS*1000);
}
