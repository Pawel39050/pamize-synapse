import {NextRequest,NextResponse} from "next/server";
import {clearCookie,exchangeCode,isAllowedProfile,makeSession,markPrivate,microsoftConfigured,microsoftProfile,safeEqual,seal,secureCookie,unseal,SESSION_COOKIE,TX_COOKIE,type AuthTransaction} from "../../../../lib/microsoft-graph";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function exit(error?:string) {
  const url=new URL("/modules/skills-knowledge","https://pamize-synapse.vercel.app");
  if(error) url.searchParams.set("microsoft",error);
  return markPrivate(NextResponse.redirect(url,{status:303}));
}

export async function GET(request:NextRequest){
  const url=new URL(request.url);
  const tx=unseal<AuthTransaction>(request.cookies.get(TX_COOKIE)?.value);
  const state=url.searchParams.get("state");
  if(!microsoftConfigured() || !tx || !state || !safeEqual(tx.state,state) || Date.now()-tx.createdAt>600_000 || Date.now()<tx.createdAt) {
    const result=exit("invalid-state");clearCookie(result,TX_COOKIE);return result;
  }
  const code=url.searchParams.get("code");
  if (!code || url.searchParams.has("error")) {
    const result=exit("cancelled");clearCookie(result,TX_COOKIE);return result;
  }
  try {
    const tokens=await exchangeCode(code,tx.verifier);
    const profile=await microsoftProfile(tokens.access_token!);
    if (!isAllowedProfile(profile)) {
      const result=exit("wrong-account");
      clearCookie(result,TX_COOKIE);clearCookie(result,SESSION_COOKIE);
      return result;
    }
    const result=exit("connected");
    secureCookie(result,SESSION_COOKIE,seal(makeSession(profile,tokens.refresh_token!)),30*24*60*60);
    clearCookie(result,TX_COOKIE);
    return result;
  } catch {
    const result=exit("auth-failed");
    clearCookie(result,TX_COOKIE);clearCookie(result,SESSION_COOKIE);
    return result;
  }
}
