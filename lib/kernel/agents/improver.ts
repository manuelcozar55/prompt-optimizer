import { MODELS } from "../../llm/models";
import { routeCall } from "../../llm/router";
import { TOOL_INJECTION_GUARD } from "../../llm/sanitize";
import { SANDWICH_STRUCTURE, FILLER_BLACKLIST } from "../doctrine";

const SYSTEM_PROMPT = `You are a senior prompt engineer. Rewrite the given prompt to be production-ready.

Apply the sandwich structure: ${SANDWICH_STRUCTURE.join(" -> ")}.

Generate 3-5 measurable acceptance criteria if missing.
Replace hedging with imperatives.
Eliminate all filler words: ${FILLER_BLACKLIST.slice(0, 10).join(", ")}, etc.

Return ONLY the improved prompt text, no explanation.

${TOOL_INJECTION_GUARD}`;

export async function improvePrompt(
  currentPrompt: string,
  criticFeedback: string,
  traceId: string
): Promise<string> {
  const response = await routeCall({
    modelId: MODELS.SONNET,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Current prompt:\n${currentPrompt}\n\nCritic feedback:\n${criticFeedback}\n\nRewrite the prompt addressing all critic feedback.`,
      },
    ],
    effort: "deep",
    traceId,
  });

  const content = (response as { content?: Array<{ type: string; text?: string }> }).content;
  return content?.find((b) => b.type === "text")?.text ?? currentPrompt;
}
