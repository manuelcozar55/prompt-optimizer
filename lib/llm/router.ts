import { callAnthropic } from "./anthropic";
import { callOpenAI } from "./openai";
import type { EffortLevel } from "./effort-mapping";

export type Provider = "anthropic" | "openai";

export function getProvider(modelId: string): Provider {
  return modelId.startsWith("claude-") ? "anthropic" : "openai";
}

export interface RouteCallOptions {
  modelId: string;
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  effort?: EffortLevel;
  maxTokens?: number;
  temperature?: number;
  traceId: string;
}

export async function routeCall(opts: RouteCallOptions) {
  const provider = getProvider(opts.modelId);
  if (provider === "anthropic") return callAnthropic(opts);
  return callOpenAI(opts);
}
