import "server-only";
import type {NextRequest} from "next/server";
import {isValidSession,SESSION_COOKIE,unseal,type MicrosoftSession} from "./microsoft-graph";

export function synapseOwner(request:NextRequest):MicrosoftSession|null{
  const session=unseal<MicrosoftSession>(request.cookies.get(SESSION_COOKIE)?.value);
  return isValidSession(session)?session:null;
}
