export function validEncryptionKey(value:string):boolean{
 if(!/^[A-Za-z0-9_-]{43}$/.test(value))return false;
 const raw=Buffer.from(value,"base64url");
 return raw.length===32&&raw.toString("base64url")===value;
}
export type EntraSetupReadiness={ready:boolean;missing:string[]};
const REQUIREMENTS=["ENTRA_TENANT_ID","ENTRA_API_CLIENT_ID","ENTRA_REDIRECT_URI","ENTRA_CLIENT_SECRET","ENTRA_OAUTH_COOKIE_KEY","ENTRA_SESSION_KEY"] as const;
/** Report names only, never values; no public authentication endpoint is enabled by this check. */
export function checkEntraSetupReadiness(env:Record<string,string|undefined>):EntraSetupReadiness{
 const missing:string[]=[];
 if(env.VERCEL_ENV!=="preview"||env.VERCEL_GIT_COMMIT_REF!=="feature/compliance-guardian")
  missing.push("ISOLATED_PREVIEW_BRANCH");
 for(const key of REQUIREMENTS){
  const value=env[key];
  if(!value?.trim()){missing.push(key);continue;}
  if((key==="ENTRA_OAUTH_COOKIE_KEY"||key==="ENTRA_SESSION_KEY")&&
     !validEncryptionKey(value))missing.push(key+":invalid-key");
 }
 if(env.ENTRA_REDIRECT_URI!==
   "https://pamize-synapse-git-feature-comp-7ded4c-radekdomagalski1978-9203.vercel.app/api/compliance/auth/callback")
  missing.push("APPROVED_PREVIEW_REDIRECT_URI");
 if(!/^[0-9a-f-]{36}$/i.test(env.ENTRA_TENANT_ID||"")||
    !/^[0-9a-f-]{36}$/i.test(env.ENTRA_API_CLIENT_ID||""))
  missing.push("VALID_ENTRA_APP_IDENTIFIERS");
 if(env.ENTRA_OAUTH_COOKIE_KEY&&env.ENTRA_SESSION_KEY&&
    env.ENTRA_OAUTH_COOKIE_KEY===env.ENTRA_SESSION_KEY)missing.push("SEPARATE_ENCRYPTION_KEYS");
 return {ready:missing.length===0,missing};
}
