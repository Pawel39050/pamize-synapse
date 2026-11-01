import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(received: string | null, expected: string | undefined): boolean {
  if (!received || !expected || expected.length < 24) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Manually invoked diagnostic only. No credentials or DB data are returned.
 * A separate randomly generated COMPLIANCE_DIAGNOSTIC_TOKEN must be provisioned
 * for this one Preview Git branch before it can be used.
 */
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "feature/compliance-guardian") {
    return NextResponse.json({ status: "unavailable" }, { status: 404 });
  }
  if (!authorized(request.headers.get("x-compliance-diagnostic-token"), process.env.COMPLIANCE_DIAGNOSTIC_TOKEN)) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }
  const connection = process.env.COMPLIANCE_DATABASE_URL;
  const expectedHost = process.env.COMPLIANCE_EXPECTED_DB_HOST;
  if (!connection || !expectedHost) return NextResponse.json({status: "not-configured"}, {status: 503});
  try {
    const url = new URL(connection);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || url.hostname !== expectedHost ||
        !url.hostname.endsWith(".neon.tech")) {
      return NextResponse.json({status: "host-mismatch"}, {status: 503});
    }
    const sql = neon(connection);
    const result = await sql`SELECT 1 AS ok`;
    return NextResponse.json({status: result[0]?.ok === 1 ? "pass" : "query-failed",
      branchIdentity: "not-verified-by-sql",
      writesPerformed: false}, {headers: {"Cache-Control":"no-store"}});
  } catch {
    return NextResponse.json({status: "connection-failed"}, {status: 503});
  }
}
