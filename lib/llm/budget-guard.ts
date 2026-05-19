// Pricing as of 2026 (approximate, conservative; $/MTok)
const COST_PER_1M_TOKENS = {
  "claude-opus-4-7": { input: 15, output: 75 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4 },
  "gpt-5-4": { input: 10, output: 40 },
} as const;

export class BudgetExceededError extends Error {
  constructor(
    public estimatedUsd: number,
    public maxUsd: number
  ) {
    super(`Budget exceeded: estimated $${estimatedUsd.toFixed(4)} > max $${maxUsd.toFixed(2)}`);
    this.name = "BudgetExceededError";
  }
}

export function estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const rates = COST_PER_1M_TOKENS[modelId as keyof typeof COST_PER_1M_TOKENS] ?? {
    input: 15,
    output: 75,
  };
  return (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
}

export function guardBudget(
  estimatedTokens: { in: number; out: number },
  modelId: string,
  maxUsd: number
): void {
  const cost = estimateCost(modelId, estimatedTokens.in, estimatedTokens.out);
  if (cost > maxUsd) throw new BudgetExceededError(cost, maxUsd);
}
