import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { runPipeline } from "@/lib/kernel/pipeline";
import { createSSEStream } from "@/lib/llm/streaming";
import { db } from "@/lib/db/client";
import { optimizations } from "@/lib/db/schema";

const RequestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  effort: z.enum(["fast", "balanced", "deep", "max"]).default("balanced"),
  tournament: z.boolean().default(false),
  max_budget_usd: z.number().positive().optional(),
  domain_override: z.string().optional(),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: z.treeifyError(parsed.error) }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const traceId = `kpo_${randomUUID()}`;
  const { readable, emit, close } = createSSEStream();

  void (async () => {
    const start = Date.now();
    try {
      const result = await runPipeline(
        {
          prompt: parsed.data.prompt,
          effort: parsed.data.effort,
          tournament: parsed.data.tournament,
          maxBudgetUsd: parsed.data.max_budget_usd,
          domainOverride: parsed.data.domain_override,
        },
        { traceId, onEvent: emit }
      );

      await db.insert(optimizations).values({
        traceId,
        input: parsed.data.prompt,
        output: result.optimizedPrompt,
        rubricScore: JSON.stringify(result.finalScore),
        domain: result.domain,
        effort: parsed.data.effort,
        totalTokens: result.totalTokens,
        totalCostUsd: result.totalCostUsd,
        durationMs: Date.now() - start,
      });
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("authentication") || msg.includes("apiKey") || msg.includes("authToken")) {
        msg = "ANTHROPIC_API_KEY is not configured. Set it in your .env.local file.";
      }
      emit({
        phase: 1,
        status: "error",
        partial: msg,
        tokens: { in: 0, out: 0, cached_read: 0, cached_write: 0 },
        cost_usd: 0,
        latency_ms: 0,
      });
    } finally {
      close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Trace-Id": traceId,
    },
  });
}
