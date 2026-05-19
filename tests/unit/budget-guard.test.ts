import { describe, it, expect } from "vitest";
import { guardBudget, BudgetExceededError, estimateCost } from "@/lib/llm/budget-guard";

describe("budget guard", () => {
  it("throws when over budget on Opus", () => {
    expect(() =>
      guardBudget({ in: 100000, out: 100000 }, "claude-opus-4-7", 0.001)
    ).toThrow(BudgetExceededError);
  });

  it("does not throw under budget on Haiku", () => {
    expect(() =>
      guardBudget({ in: 100, out: 50 }, "claude-haiku-4-5-20251001", 1.0)
    ).not.toThrow();
  });

  it("estimateCost matches Haiku rates", () => {
    const cost = estimateCost("claude-haiku-4-5-20251001", 1_000_000, 0);
    expect(cost).toBeCloseTo(0.8, 2);
  });
});
