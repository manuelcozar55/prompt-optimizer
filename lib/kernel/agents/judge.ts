import { MODELS } from "../../llm/models";
import { routeCall } from "../../llm/router";
import { TOOL_INJECTION_GUARD } from "../../llm/sanitize";
import { computeOverallScore, WEIGHTS_DEFAULT } from "../rubric";
import type { RubricScore, Dimension } from "../rubric";

// Source: Hamel Husain calibration methodology, 2024-2025
const SYSTEM_PROMPT = `You are a calibrated LLM-as-judge evaluating prompt quality. Assess the given prompt against 7 dimensions, each as pass/fail.

Dimensions:
1. clarity: Would a domain expert without context understand exactly what is being asked?
2. specificity: Is the scope, tech stack, metrics, and deadline bounded?
3. completeness: Does it have measurable acceptance criteria?
4. groundedness: Are claims cited or labeled as assumptions?
5. testability: Can the output be automatically verified?
6. robustness: Does it defend against injection, ambiguity, edge inputs?
7. cost_efficiency: Are token count and caching proportional to the value?

Return ONLY JSON matching this schema:
{
  "dimensions": {
    "clarity": {"pass": true/false, "rationale": "one sentence"},
    "specificity": {...},
    "completeness": {...},
    "groundedness": {...},
    "testability": {...},
    "robustness": {...},
    "cost_efficiency": {...}
  },
  "domain": "code|writing|agentic|research|creative|analytical"
}

${TOOL_INJECTION_GUARD}`;

export async function judgePrompt(
  prompt: string,
  domain: string,
  traceId: string
): Promise<RubricScore> {
  const response = await routeCall({
    modelId: MODELS.OPUS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Domain: ${domain}\n\nPrompt to evaluate:\n${prompt}` }],
    effort: "deep",
    temperature: 0,
    traceId,
  });

  const content = (response as { content?: Array<{ type: string; text?: string }> }).content;
  const text = content?.find((b) => b.type === "text")?.text ?? "{}";

  try {
    const parsed = JSON.parse(text);
    const dims = parsed.dimensions as Record<Dimension, { pass: boolean; rationale: string }>;
    const { overall, band } = computeOverallScore(dims, domain);
    return { dimensions: dims, overall, band, domain };
  } catch {
    const fallback = Object.fromEntries(
      Object.keys(WEIGHTS_DEFAULT).map((d) => [d, { pass: false, rationale: "parse error" }])
    ) as Record<Dimension, { pass: boolean; rationale: string }>;
    return { dimensions: fallback, overall: 0, band: "iterate", domain };
  }
}
