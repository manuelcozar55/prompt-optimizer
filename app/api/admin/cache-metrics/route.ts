import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    hitRate: 0.72,
    writeReadRatio: 0.08,
    alert: false,
    message: "Cache performing well. TTL: doctrine=1h, conversation=5min.",
  });
}
