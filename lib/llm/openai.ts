import OpenAI from "openai";
import { mapEffort, type EffortLevel } from "./effort-mapping";
import pino from "pino";

const logger = pino();

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) _client = new OpenAI();
  return _client;
}

export interface OpenAICallOptions {
  modelId: string;
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  effort?: EffortLevel;
  maxTokens?: number;
  temperature?: number;
  traceId: string;
}

export async function callOpenAI(opts: OpenAICallOptions) {
  const { modelId, system, messages, effort = "balanced", maxTokens = 8192, traceId } = opts;
  const effortValue = mapEffort(effort, "openai");

  let attempts = 0;
  while (attempts < 3) {
    try {
      const start = Date.now();
      const response = (await getClient().chat.completions.create({
        model: modelId,
        max_completion_tokens: maxTokens,
        reasoning_effort: effortValue as never,
        messages: [{ role: "system", content: system }, ...messages],
      } as Parameters<OpenAI["chat"]["completions"]["create"]>[0])) as unknown as {
        usage?: { prompt_tokens?: number; completion_tokens?: number };
        choices?: unknown;
      };

      logger.info({
        traceId,
        model: modelId,
        effort: effortValue,
        tokens: {
          input: response.usage?.prompt_tokens ?? 0,
          output: response.usage?.completion_tokens ?? 0,
        },
        latency_ms: Date.now() - start,
      });

      return response;
    } catch (err: unknown) {
      attempts++;
      const e = err as { status?: number };
      if (attempts >= 3 || (e.status && e.status < 500 && e.status !== 429)) throw err;
      await new Promise((r) => setTimeout(r, Math.pow(2, attempts) * 1000));
    }
  }
  throw new Error("Max retries exceeded");
}
