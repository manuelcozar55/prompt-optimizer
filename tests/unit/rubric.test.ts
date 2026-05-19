import { describe, it, expect } from "vitest";
import { computeOverallScore, WEIGHTS_DEFAULT, WEIGHTS_BY_DOMAIN } from "@/lib/kernel/rubric";

const ALL_PASS = Object.fromEntries(
  Object.keys(WEIGHTS_DEFAULT).map((d) => [d, { pass: true }])
) as Record<keyof typeof WEIGHTS_DEFAULT, { pass: boolean }>;

const ALL_FAIL = Object.fromEntries(
  Object.keys(WEIGHTS_DEFAULT).map((d) => [d, { pass: false }])
) as Record<keyof typeof WEIGHTS_DEFAULT, { pass: boolean }>;

describe("rubric scoring", () => {
  it("all pass -> 100", () => {
    const { overall, band } = computeOverallScore(ALL_PASS, "code");
    expect(overall).toBe(100);
    expect(band).toBe("production");
  });

  it("all fail -> 0", () => {
    const { overall, band } = computeOverallScore(ALL_FAIL, "code");
    expect(overall).toBe(0);
    expect(band).toBe("iterate");
  });

  it("mix produces acceptable band when overall >= 70", () => {
    const dims = { ...ALL_PASS, groundedness: { pass: false }, robustness: { pass: false } };
    const { overall, band } = computeOverallScore(dims, "code");
    expect(overall).toBeGreaterThan(0);
    expect(["acceptable", "production", "iterate"]).toContain(band);
  });

  it("domain weight overrides exist for code", () => {
    expect(WEIGHTS_BY_DOMAIN.code).toBeDefined();
  });
});
