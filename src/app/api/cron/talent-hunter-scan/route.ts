import {NextRequest,NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {scanKprm} from "../../../../lib/hunter-scan-db";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
export async function GET(request:NextRequest){
  const secret=process.env.CRON_SECRET;
  const token=request.headers.get("authorization")??"";
  const expected=secret?"Bearer "+secret:"";
  if(!secret||secret.length<32||Buffer.byteLength(token)!==Buffer.byteLength(expected)||
    !timingSafeEqual(Buffer.from(token),Buffer.from(expected))){
    return NextResponse.json({error:"Unauthorized"},{status:401});
  }
  if(process.env.HUNTER_SCANNER_ENABLED!=="1"){
    return NextResponse.json({ok:true,enabled:false,scanned:false},{headers:{"Cache-Control":"no-store"}});
  }
  try{
    const {run}=await scanKprm();
    return NextResponse.json({ok:run.status==="success",source:run.sourceKey,found:run.matchedCount,
      newCandidates:run.insertedCount,status:run.status,errorCode:run.errorCode},
      {status:run.status==="success"?200:502,headers:{"Cache-Control":"no-store"}});
  }catch{
    console.error("[Hunter Cron] scan failed");
    return NextResponse.json({error:"Scan unavailable"},{status:503});
  }
}
