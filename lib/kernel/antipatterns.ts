import {
  FILLER_BLACKLIST,
  HEDGING_BLACKLIST,
  SYCOPHANCY_DETECT_REGEX,
  OVER_HEDGING_PATTERNS,
} from "./doctrine";

export function detectFillers(text: string): string[] {
  const lower = text.toLowerCase();
  return FILLER_BLACKLIST.filter((f) => lower.includes(f.toLowerCase()));
}

export function detectHedging(text: string): string[] {
  const lower = text.toLowerCase();
  return HEDGING_BLACKLIST.filter((h) => lower.includes(h.toLowerCase()));
}

// Source: SycEval arXiv 2502.08177
export function detectSycophancy(output: string, _input?: string): boolean {
  void _input;
  return SYCOPHANCY_DETECT_REGEX.test(output);
}

// Source: arXiv 2602.01002
export function detectOverHedging(output: string): boolean {
  return OVER_HEDGING_PATTERNS.some((p) => p.test(output));
}

export function getAntipatternSummary(text: string): {
  fillers: string[];
  hedging: string[];
  sycophantic: boolean;
  overHedged: boolean;
} {
  return {
    fillers: detectFillers(text),
    hedging: detectHedging(text),
    sycophantic: detectSycophancy(text, ""),
    overHedged: detectOverHedging(text),
  };
}
