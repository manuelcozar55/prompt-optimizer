// Source: Anthropic adaptive thinking docs + OpenAI GPT-5 cookbook, abr 2026
export type EffortLevel = "fast" | "balanced" | "deep" | "max";

const EFFORT_MAP = {
  anthropic: { fast: "low", balanced: "medium", deep: "high", max: "max" },
  openai: { fast: "minimal", balanced: "low", deep: "medium", max: "high" },
} as const;

export function mapEffort(level: EffortLevel, provider: "anthropic" | "openai"): string {
  return EFFORT_MAP[provider][level];
}
