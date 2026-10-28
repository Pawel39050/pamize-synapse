import {NextRequest,NextResponse} from "next/server";
import {isValidSession,markPrivate,microsoftConfigured,unseal,SESSION_COOKIE,type MicrosoftSession} from "../../../../lib/microsoft-graph";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(request:NextRequest) {
  const configured=microsoftConfigured();
  const session=configured?unseal<MicrosoftSession>(request.cookies.get(SESSION_COOKIE)?.value):null;
  return markPrivate(NextResponse.json({
    configured,
    connected:configured && isValidSession(session),
    account:configured && isValidSession(session)?session.email:null,
    mode:"read-only",
    source:"OneDrive Personal",
    note:configured?"Autoryzacja tylko do odczytu Files.Read.":"Konfiguracja aplikacji Microsoft jest wymagana."
  }));
}
