// Source: PROMPT_ENGINEERING_2026.md §5.3 — 7-D binary rubric

export type Dimension =
  | "clarity"
  | "specificity"
  | "completeness"
  | "groundedness"
  | "testability"
  | "robustness"
  | "cost_efficiency";

export interface DimensionResult {
  pass: boolean;
  rationale: string;
}

export interface RubricScore {
  dimensions: Record<Dimension, DimensionResult>;
  overall: number;
  band: "production" | "acceptable" | "iterate";
  domain: string;
}

export const WEIGHTS_DEFAULT: Record<Dimension, number> = {
  clarity: 0.15,
  specificity: 0.15,
  completeness: 0.15,
  groundedness: 0.15,
  testability: 0.15,
  robustness: 0.15,
  cost_efficiency: 0.10,
};

// Per-domain weight overrides. Re-normalized at runtime.
export const WEIGHTS_BY_DOMAIN: Record<string, Partial<Record<Dimension, number>>> = {
  code: {
    testability: 0.25,
    specificity: 0.20,
    completeness: 0.15,
  },
  writing: {
    clarity: 0.25,
    specificity: 0.20,
  },
  agentic: {
    robustness: 0.25,
    testability: 0.20,
  },
  research: {
    groundedness: 0.30,
    specificity: 0.20,
  },
  creative: {
    clarity: 0.20,
    specificity: 0.15,
    groundedness: 0.05,
  },
  analytical: {
    groundedness: 0.20,
    testability: 0.20,
    specificity: 0.20,
  },
};

export function computeOverallScore(
  dimensions: Record<Dimension, { pass: boolean }>,
  domain: string
): { overall: number; band: RubricScore["band"] } {
  const domainWeights = WEIGHTS_BY_DOMAIN[domain] ?? {};
  const weights = { ...WEIGHTS_DEFAULT, ...domainWeights };
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let overall = 0;
  for (const [dim, { pass }] of Object.entries(dimensions)) {
    overall += (pass ? 1 : 0) * ((weights[dim as Dimension] ?? 0) / total);
  }
  overall = Math.round(overall * 100);
  const band: RubricScore["band"] =
    overall >= 85 ? "production" : overall >= 70 ? "acceptable" : "iterate";
  return { overall, band };
}
