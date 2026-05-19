import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({
    status: "started",
    message: "Eval suite running. Check /evals for results.",
  });
}
