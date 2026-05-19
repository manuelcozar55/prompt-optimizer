import { MODELS } from "../../llm/models";
import { routeCall } from "../../llm/router";
import { TOOL_INJECTION_GUARD } from "../../llm/sanitize";

const SYSTEM_PROMPT = `You are a harsh prompt engineering reviewer. Your job is to find exactly 5 specific flaws in the given prompt.

Be specific: quote the problematic text and explain why it fails.
Format your response as a JSON array of 5 strings, each describing one flaw.
Example: ["'might help' is hedging - use 'will return'", ...]

${TOOL_INJECTION_GUARD}`;

export async function critiquePrompt(prompt: string, traceId: string): Promise<string[]> {
  const response = await routeCall({
    modelId: MODELS.OPUS,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: `Review this prompt and list exactly 5 flaws:\n\n${prompt}` },
    ],
    effort: "deep",
    traceId,
  });

  const content = (response as { content?: Array<{ type: string; text?: string }> }).content;
  const text = content?.find((b) => b.type === "text")?.text ?? "[]";
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [text];
  }
}
