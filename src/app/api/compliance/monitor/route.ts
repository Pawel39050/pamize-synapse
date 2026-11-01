import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { monitorRegisteredSource } from "../../../../lib/compliance/source-monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function secureCompare(a: string | null, b: string | undefined): boolean {
  if (!a || !b || b.length < 24) return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  // Never accept runs in Production or on another feature branch.
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "feature/compliance-guardian") {
    return NextResponse.json({status:"unavailable"},{status:404});
  }
  if (!secureCompare(request.headers.get("x-compliance-diagnostic-token"),
                     process.env.COMPLIANCE_DIAGNOSTIC_TOKEN)) {
    return NextResponse.json({status:"unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
  }
  if (process.env.COMPLIANCE_STORAGE_ENABLED !== "true" ||
      process.env.COMPLIANCE_ISOLATED_DB_CONFIRMED !== "true") {
    return NextResponse.json({status:"disabled"},{status:503,headers:{"Cache-Control":"no-store"}});
  }
  const result = await monitorRegisteredSource("pl-uodo");
  // Do not expose secrets or raw downloaded content.
  return NextResponse.json({
    sourceId:result.sourceId,status:result.status,
    persisted:result.persisted,
    requiresReview:"requiresDocumentReview" in result ? result.requiresDocumentReview : false,
    fetchedAt:"fetchedAt" in result ? result.fetchedAt : null,
    message:result.status==="fetch-error" || result.status==="storage-error" ? "Monitoring could not complete" : "Monitoring completed"
  },{status:result.status.endsWith("error") ? 503 : 200,headers:{"Cache-Control":"no-store"}});
}
