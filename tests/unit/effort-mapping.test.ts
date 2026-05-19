import { describe, it, expect } from "vitest";
import { mapEffort } from "@/lib/llm/effort-mapping";

describe("effort mapping", () => {
  it("anthropic deep -> high", () => {
    expect(mapEffort("deep", "anthropic")).toBe("high");
  });

  it("openai max -> high", () => {
    expect(mapEffort("max", "openai")).toBe("high");
  });

  it("anthropic fast -> low", () => {
    expect(mapEffort("fast", "anthropic")).toBe("low");
  });

  it("openai balanced -> low", () => {
    expect(mapEffort("balanced", "openai")).toBe("low");
  });
});
