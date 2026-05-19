import { SANDWICH_STRUCTURE, isReasoningModel } from "../doctrine";

export function buildUniversalSandwich(
  _domain: string,
  effort: string,
  modelId: string
): string {
  const sections = [...SANDWICH_STRUCTURE];
  const skipExamples = isReasoningModel(modelId) && ["deep", "max"].includes(effort);
  return sections
    .filter((s) => !(s === "examples" && skipExamples))
    .map((s) => `<${s}>\n{{${s}}}\n</${s}>`)
    .join("\n\n");
}
