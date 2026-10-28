import {NextRequest,NextResponse} from "next/server";
import {markPrivate,microsoftAuthorizeUrl,microsoftConfigured,pkceChallenge,randomUrlToken,seal,secureCookie,TX_COOKIE,type AuthTransaction} from "../../../../lib/microsoft-graph";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(_request:NextRequest) {
  if (!microsoftConfigured()) return markPrivate(NextResponse.json({error:"Brak konfiguracji Microsoft OAuth. Administrator musi zarejestrować aplikację i uzupełnić sekrety Vercel."},{status:503}));
  const state=randomUrlToken(),verifier=randomUrlToken(48);
  const tx:AuthTransaction={state,verifier,createdAt:Date.now()};
  const response=NextResponse.redirect(microsoftAuthorizeUrl(state,pkceChallenge(verifier)),{status:302});
  secureCookie(response,TX_COOKIE,seal(tx),600);
  return markPrivate(response);
}
