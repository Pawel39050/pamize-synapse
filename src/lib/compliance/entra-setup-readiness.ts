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
     Buffer.from(value,"base64url").length!==32)missing.push(key+":invalid-key");
 }
 if(env.ENTRA_OAUTH_COOKIE_KEY&&env.ENTRA_SESSION_KEY&&
    env.ENTRA_OAUTH_COOKIE_KEY===env.ENTRA_SESSION_KEY)missing.push("SEPARATE_ENCRYPTION_KEYS");
 return {ready:missing.length===0,missing};
}
