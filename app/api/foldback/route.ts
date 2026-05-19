import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  prompt: z.string().min(1),
  name: z.string().min(1),
  domain: z.string().default("code"),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 });
  return NextResponse.json({ saved: true, name: parsed.data.name });
}
