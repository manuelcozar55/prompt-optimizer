import { describe, it, expect } from "vitest";
import {
  FILLER_BLACKLIST,
  HEDGING_BLACKLIST,
  SANDWICH_STRUCTURE,
  isReasoningModel,
} from "@/lib/kernel/doctrine";

describe("doctrine constants", () => {
  it("FILLER_BLACKLIST has >= 20 entries", () => {
    expect(FILLER_BLACKLIST.length).toBeGreaterThanOrEqual(20);
  });

  it("HEDGING_BLACKLIST has >= 10 entries", () => {
    expect(HEDGING_BLACKLIST.length).toBeGreaterThanOrEqual(10);
  });

  it("SANDWICH_STRUCTURE has 8 sections", () => {
    expect(SANDWICH_STRUCTURE.length).toBe(8);
  });

  it("classifies Opus as reasoning", () => {
    expect(isReasoningModel("claude-opus-4-7")).toBe(true);
  });

  it("classifies Haiku as non-reasoning", () => {
    expect(isReasoningModel("claude-haiku-4-5-20251001")).toBe(false);
  });
});
