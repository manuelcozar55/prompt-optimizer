import { MODELS } from "../../llm/models";
import { routeCall } from "../../llm/router";
import { TOOL_INJECTION_GUARD } from "../../llm/sanitize";

const DOMAINS = ["code", "writing", "agentic", "research", "creative", "analytical"] as const;
export type Domain = (typeof DOMAINS)[number];

// Source: Anthropic Building Effective Agents
const SYSTEM_PROMPT = `You are a domain classifier. Given a prompt, return JSON with:
{"domain": one of ${DOMAINS.join("|")}, "confidence": 0.0-1.0, "reasoning": "one line"}

${TOOL_INJECTION_GUARD}
IMPORTANT: Return ONLY valid JSON, no markdown.`;

export async function classifyDomain(
  userPrompt: string,
  traceId: string
): Promise<{ domain: Domain; confidence: number }> {
  const response = await routeCall({
    modelId: MODELS.HAIKU,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
    effort: "fast",
    traceId,
  });

  const content = (response as { content?: Array<{ type: string; text?: string }> }).content;
  const text = content?.find((b) => b.type === "text")?.text ?? "{}";
  try {
    const parsed = JSON.parse(text);
    const domain = (DOMAINS as readonly string[]).includes(parsed.domain)
      ? (parsed.domain as Domain)
      : "code";
    return { domain, confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5)) };
  } catch {
    return { domain: "code", confidence: 0.5 };
  }
}
