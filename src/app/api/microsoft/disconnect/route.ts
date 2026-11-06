import {NextRequest,NextResponse} from "next/server";
import {clearCookie,markPrivate,SESSION_COOKIE,TX_COOKIE} from "../../../../lib/microsoft-graph";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function POST(request:NextRequest){
  // An Origin check protects this session-changing endpoint against cross-site requests.
  if(request.headers.get("origin")!=="https://pamize-synapse.vercel.app")
    return markPrivate(NextResponse.json({error:"Invalid origin"},{status:403}));
  const result=NextResponse.json({disconnected:true});
  clearCookie(result,SESSION_COOKIE);clearCookie(result,TX_COOKIE);
  return markPrivate(result);
}
