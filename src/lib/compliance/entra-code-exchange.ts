import "server-only";
import {validateOAuthCallback,type OAuthTransaction} from "./entra-oauth-flow";

export type TokenResponse={id_token:string;token_type:string;expires_in:number;access_token?:string};

/** Confidential Web-app token exchange. Never call from a client component.
 * No public auth route or persistent session is enabled by this module. */
export async function exchangeEntraAuthorizationCode(args:{
 tenantId:string;clientId:string;clientSecret:string;redirectUri:string;
 code:string;returnedState:string|null;transaction:OAuthTransaction;
}):Promise<TokenResponse>{
 validateOAuthCallback({transaction:args.transaction,returnedState:args.returnedState});
 if(!/^[0-9a-f-]{36}$/i.test(args.tenantId)||!/^[0-9a-f-]{36}$/i.test(args.clientId)||
    !args.clientSecret||args.clientSecret.length<8||!args.code||args.code.length>4096)
   throw Error("Invalid confidential OAuth configuration");
 const callback=new URL(args.redirectUri);
 if(callback.origin!=="https://pamize-synapse-git-feature-comp-7ded4c-radekdomagalski1978-9203.vercel.app"||
   callback.pathname!=="/api/compliance/auth/callback"||callback.search||callback.hash)
   throw Error("Callback address is not approved");
 const endpoint=`https://login.microsoftonline.com/${args.tenantId}/oauth2/v2.0/token`;
 const body=new URLSearchParams({grant_type:"authorization_code",client_id:args.clientId,
  client_secret:args.clientSecret,code:args.code,redirect_uri:args.redirectUri,
  code_verifier:args.transaction.codeVerifier,scope:"openid profile"});
 const response=await fetch(endpoint,{method:"POST",cache:"no-store",
  headers:{"content-type":"application/x-www-form-urlencoded"},body,signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw Error("Microsoft Entra token exchange rejected");
 const raw=await response.text();
 if(raw.length>20000)throw Error("Unexpected Entra token response size");
 const data=JSON.parse(raw) as Partial<TokenResponse>;
 if(typeof data.id_token!=="string"||data.id_token.length>12000||
    data.token_type!=="Bearer"||typeof data.expires_in!=="number"||
    !Number.isFinite(data.expires_in)||data.expires_in<=0)
   throw Error("Invalid Entra token response");
 return {id_token:data.id_token,token_type:data.token_type,expires_in:data.expires_in,
  access_token:typeof data.access_token==="string"?data.access_token:undefined};
}
