import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    service: "pamize-synapse",
    version: "0.1.0",
    mode: "demonstration",
    databaseConnected: false,
    aiRuntimeConnected: false
  }, {headers: {"Cache-Control": "no-store"}});
}
