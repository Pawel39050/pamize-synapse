import {createHash,randomBytes} from "node:crypto";
export type OAuthTransaction={state:string;nonce:string;codeVerifier:string;createdAt:number};
const random=()=>randomBytes(32).toString("base64url");
export function newOAuthTransaction(now=Date.now()):OAuthTransaction{
 return {state:random(),nonce:random(),codeVerifier:random(),createdAt:now};
}
export function pkceChallenge(verifier:string):string{
 if(!/^[A-Za-z0-9_-]{43,128}$/.test(verifier))throw Error("Invalid PKCE verifier");
 return createHash("sha256").update(verifier).digest("base64url");
}
export function buildEntraAuthorizationUrl(args:{
 tenantId:string;clientId:string;redirectUri:string;transaction:OAuthTransaction;
}):string{
 if(!/^[0-9a-f-]{36}$/i.test(args.tenantId)||!/^[0-9a-f-]{36}$/i.test(args.clientId))
  throw Error("Invalid Entra IDs");
 const redirect=new URL(args.redirectUri);
 if(redirect.protocol!=="https:"||redirect.hostname!=="pamize-synapse-git-feature-comp-7ded4c-radekdomagalski1978-9203.vercel.app"||
    redirect.pathname!=="/api/compliance/auth/callback"||redirect.username||redirect.password)
  throw Error("Unapproved Preview callback URI");
 const u=new URL(`https://login.microsoftonline.com/${args.tenantId}/oauth2/v2.0/authorize`);
 u.searchParams.set("client_id",args.clientId);
 u.searchParams.set("response_type","code");
 u.searchParams.set("redirect_uri",redirect.toString());
 u.searchParams.set("scope","openid profile");
 u.searchParams.set("response_mode","query");
 u.searchParams.set("state",args.transaction.state);
 u.searchParams.set("nonce",args.transaction.nonce);
 u.searchParams.set("code_challenge",pkceChallenge(args.transaction.codeVerifier));
 u.searchParams.set("code_challenge_method","S256");
 return u.toString();
}
export function validateOAuthCallback(input:{transaction:OAuthTransaction;returnedState:string|null;now?:number}):void{
 const now=input.now??Date.now();
 if(!input.returnedState||input.returnedState!==input.transaction.state||
  now<input.transaction.createdAt||now-input.transaction.createdAt>5*60*1000)
  throw Error("OAuth state missing, mismatched or expired");
}
