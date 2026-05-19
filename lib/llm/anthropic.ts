import Anthropic from "@anthropic-ai/sdk";
import { MODELS } from "./models";
import { mapEffort, type EffortLevel } from "./effort-mapping";
import { applyCacheBreakpoint } from "./cache-strategy";
import pino from "pino";

const logger = pino();

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

export interface AnthropicCallOptions {
  modelId: string;
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  effort?: EffortLevel;
  maxTokens?: number;
  temperature?: number;
  traceId: string;
}

export async function callAnthropic(opts: AnthropicCallOptions) {
  const {
    modelId,
    system,
    messages,
    effort = "balanced",
    maxTokens = 8192,
    temperature,
    traceId,
  } = opts;
  const effortValue = mapEffort(effort, "anthropic");

  const isThinkingModel = modelId === MODELS.OPUS || modelId === MODELS.SONNET;

  const cachedMessages = applyCacheBreakpoint(
    messages.map((m) => ({ role: m.role, content: m.content })),
    0
  );

  let attempts = 0;
  while (attempts < 3) {
    try {
      const start = Date.now();
      const response = (await getClient().messages.create({
        model: modelId,
        max_tokens: maxTokens,
        ...(temperature !== undefined ? { temperature } : {}),
        ...(isThinkingModel
          ? ({
              thinking: { type: "adaptive" },
              output_config: { effort: effortValue },
            } as Record<string, unknown>)
          : {}),
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: cachedMessages,
      } as Parameters<Anthropic["messages"]["create"]>[0])) as unknown as {
        usage?: Record<string, number>;
        content?: unknown;
      };

      const usage = (response.usage ?? {}) as Record<string, number>;
      logger.info({
        traceId,
        model: modelId,
        effort: effortValue,
        tokens: {
          input: usage.input_tokens ?? 0,
          output: usage.output_tokens ?? 0,
          cached_read: usage.cache_read_input_tokens ?? 0,
          cached_write: usage.cache_creation_input_tokens ?? 0,
        },
        latency_ms: Date.now() - start,
      });

      return response;
    } catch (err: unknown) {
      attempts++;
      const e = err as { status?: number; message?: string };
      if (attempts >= 3 || (e.status && e.status < 500 && e.status !== 429)) throw err;
      await new Promise((r) => setTimeout(r, Math.pow(2, attempts) * 1000));
    }
  }
  throw new Error("Max retries exceeded");
}
