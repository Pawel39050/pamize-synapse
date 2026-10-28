import {NextResponse} from "next/server";
import {getHunterEngineStatus} from "../../../../lib/talent-hunter-engine";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){return getHunterEngineStatus();}
export async function POST(){
  // No unauthenticated model calls: the owner-only route has the real analysis API.
  return NextResponse.json({error:"Analiza wymaga sesji właściciela Microsoft. Odśwież moduł Talent Hunter."},
    {status:403,headers:{"Cache-Control":"no-store, private"}});
}
