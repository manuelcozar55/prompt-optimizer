// Source: docs.claude.com 2026; docs.openai.com 2026
export const MODELS = {
  OPUS: "claude-opus-4-7",
  SONNET: "claude-sonnet-4-6",
  HAIKU: "claude-haiku-4-5-20251001",
  GPT: "gpt-5-4",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];
