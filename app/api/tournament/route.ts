import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MODELS } from "@/lib/llm/models";
import { routeCall } from "@/lib/llm/router";
import { judgePrompt } from "@/lib/kernel/agents/judge";
import { guardBudget } from "@/lib/llm/budget-guard";
import { randomUUID } from "crypto";

const Schema = z.object({
  prompt: z.string().min(1),
  max_budget_usd: z.number().positive(),
  domain: z.string().default("code"),
});

export const runtime = "nodejs";

function extractOutput(r: unknown): string {
  const x = r as {
    content?: Array<{ type: string; text?: string }>;
    choices?: Array<{ message?: { content?: string } }>;
  };
  if (x.content) return x.content.find((b) => b.type === "text")?.text ?? "";
  if (x.choices) return x.choices[0]?.message?.content ?? "";
  return "";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 });

  const { prompt, max_budget_usd, domain } = parsed.data;
  const traceId = `tournament_${randomUUID()}`;

  try {
    guardBudget({ in: 5000, out: 2000 }, MODELS.OPUS, max_budget_usd / 3);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const [opusResp, sonnetResp, gptResp] = await Promise.all([
    routeCall({
      modelId: MODELS.OPUS,
      system: "Execute the following prompt.",
      messages: [{ role: "user", content: prompt }],
      effort: "deep",
      traceId: traceId + "_opus",
    }),
    routeCall({
      modelId: MODELS.SONNET,
      system: "Execute the following prompt.",
      messages: [{ role: "user", content: prompt }],
      effort: "deep",
      traceId: traceId + "_sonnet",
    }),
    routeCall({
      modelId: MODELS.GPT,
      system: "Execute the following prompt.",
      messages: [{ role: "user", content: prompt }],
      effort: "deep",
      traceId: traceId + "_gpt",
    }),
  ]);

  const [opusScore, sonnetScore, gptScore] = await Promise.all([
    judgePrompt(extractOutput(opusResp), domain, traceId + "_judge_opus"),
    judgePrompt(extractOutput(sonnetResp), domain, traceId + "_judge_sonnet"),
    judgePrompt(extractOutput(gptResp), domain, traceId + "_judge_gpt"),
  ]);

  const results = [
    { model: MODELS.OPUS, output: extractOutput(opusResp), score: opusScore },
    { model: MODELS.SONNET, output: extractOutput(sonnetResp), score: sonnetScore },
    { model: MODELS.GPT, output: extractOutput(gptResp), score: gptScore },
  ];

  const winner = results.reduce((a, b) => (a.score.overall >= b.score.overall ? a : b));

  return NextResponse.json({ results, winner: winner.model, traceId });
}
