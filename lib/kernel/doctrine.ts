import { MODELS, type ModelId } from "../llm/models";

// Source: Anthropic sandwich structure guide, 2025
export const SANDWICH_STRUCTURE = [
  "role",
  "context",
  "instructions",
  "acceptance_criteria",
  "examples", // Skip in reasoning models with effort >= "deep"
  "thinking", // Output tag, NOT an instruction "think step by step"
  "output_format",
  "forbidden",
] as const;

export type SandwichSection = (typeof SANDWICH_STRUCTURE)[number];

export const ACCEPTANCE_CRITERIA_REQUIRED = true; // P0 universal

// Source: SycEval arXiv 2502.08177
export const SYCOPHANCY_DETECT_REGEX =
  /(you'?re absolutely right|great point|excellent question|i (totally |completely )?agree)/i;

// Source: arXiv 2602.01002
export const OVER_HEDGING_PATTERNS = [
  /it depends/i,
  /there are many (factors|considerations)/i,
  /on the one hand.*on the other hand/is,
];

// Source: ycombinator_prompts.md + PROMPT_ENGINEERING_2026.md §4
export const FILLER_BLACKLIST = [
  "delve",
  "tapestry",
  "embark",
  "meticulous",
  "vibrant",
  "synergy",
  "leverage",
  "holistic",
  "navigate",
  "robust",
  "seamless",
  "unlock",
  "unleash",
  "empower",
  "transform",
  "revolutionize",
  "redefine",
  "reimagine",
  "cutting-edge",
  "state-of-the-art",
  "groundbreaking",
  "paradigm shift",
  "game-changer",
  "journey",
  "fascinating",
  "exciting",
  "intriguing",
  "in today's fast-paced world",
  "in an era of",
  "in the realm of",
  "when it comes to",
  "it's important to note",
  "it's worth mentioning",
  "needless to say",
];

// Source: PROMPT_ENGINEERING_2026.md §4.2
export const HEDGING_BLACKLIST = [
  "could",
  "might",
  "possibly",
  "perhaps",
  "when you get a chance",
  "arguably",
  "somewhat",
  "fairly",
  "kind of",
  "sort of",
  "more or less",
  "one could argue",
  "some might say",
  "generally speaking",
  "broadly speaking",
  "I would suggest",
  "you might want to consider",
];

export const REASONING_MODELS: ModelId[] = [MODELS.OPUS, MODELS.SONNET];

export function isReasoningModel(modelId: string): boolean {
  return REASONING_MODELS.includes(modelId as ModelId);
}
