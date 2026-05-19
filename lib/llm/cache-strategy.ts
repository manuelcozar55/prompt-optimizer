import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

// Source: ProjectDiscovery -59% coste, abr 2026
export const CACHE_TTL = {
  DOCTRINE_OVERLAY: 3600, // 1h — system prompts + domain overlays
  CONVERSATION: 300, // 5min — conversation messages
} as const;

export interface CacheMetrics {
  traceId: string;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  writeReadRatio: number;
  alert: boolean;
}

export function applyCacheBreakpoint(
  messages: MessageParam[],
  breakpointIndex: number
): MessageParam[] {
  return messages.map((m, i) => {
    if (i !== breakpointIndex) return m;
    const content = Array.isArray(m.content)
      ? m.content
      : [{ type: "text" as const, text: m.content as string }];
    if (content.length === 0) return m;
    const last = content[content.length - 1] as { type: string; text?: string };
    if (last.type !== "text") return m;
    return {
      ...m,
      content: [
        ...content.slice(0, -1),
        { ...last, cache_control: { type: "ephemeral" } },
      ],
    } as MessageParam;
  });
}

export function computeCacheMetrics(
  traceId: string,
  cacheRead: number,
  cacheWrite: number
): CacheMetrics {
  const ratio = cacheWrite > 0 ? cacheWrite / (cacheRead || 1) : 0;
  return {
    traceId,
    cacheReadInputTokens: cacheRead,
    cacheCreationInputTokens: cacheWrite,
    writeReadRatio: ratio,
    alert: ratio > 0.2,
  };
}
