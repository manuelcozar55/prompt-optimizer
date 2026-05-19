import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const BASELINE_FILE = path.join(process.cwd(), "data", "eval-baseline.json");

interface Baseline {
  passRate: number;
  date: string;
}

export function readBaseline(): Baseline | null {
  if (!existsSync(BASELINE_FILE)) return null;
  return JSON.parse(readFileSync(BASELINE_FILE, "utf-8")) as Baseline;
}

export function writeBaseline(passRate: number): void {
  writeFileSync(BASELINE_FILE, JSON.stringify({ passRate, date: new Date().toISOString() }));
}

export function shouldBlockMerge(currentPassRate: number): { block: boolean; reason: string } {
  const baseline = readBaseline();
  if (!baseline) return { block: false, reason: "No baseline yet" };
  const delta = baseline.passRate - currentPassRate;
  if (delta > 5) {
    return {
      block: true,
      reason: `pass-rate dropped ${delta.toFixed(1)}pp from baseline ${baseline.passRate}%`,
    };
  }
  return { block: false, reason: "" };
}
