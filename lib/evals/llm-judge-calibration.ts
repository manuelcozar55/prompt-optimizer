import type { Dimension } from "@/lib/kernel/rubric";
import { judgePrompt } from "./llm-judge";
import humanLabels from "./human-labels.json" with { type: "json" };

interface LabelEntry {
  id: string;
  domain: string;
  prompt: string;
  human_judgment: Record<Dimension, boolean>;
}

export class CalibrationFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalibrationFailedError";
  }
}

export async function calibrateJudge() {
  const results: Record<Dimension, { tp: number; fp: number; fn: number; tn: number }> =
    {} as Record<Dimension, { tp: number; fp: number; fn: number; tn: number }>;

  for (const label of humanLabels as LabelEntry[]) {
    const judgeScore = await judgePrompt(label.prompt, label.domain, `cal_${label.id}`);
    for (const [dim, humanPass] of Object.entries(label.human_judgment) as [
      Dimension,
      boolean
    ][]) {
      if (!results[dim]) results[dim] = { tp: 0, fp: 0, fn: 0, tn: 0 };
      const judgePass = judgeScore.dimensions[dim]?.pass ?? false;
      if (humanPass && judgePass) results[dim].tp++;
      else if (!humanPass && judgePass) results[dim].fp++;
      else if (humanPass && !judgePass) results[dim].fn++;
      else results[dim].tn++;
    }
  }

  const report: Record<string, { precision: number; recall: number; f1: number }> = {};
  let allValid = true;

  for (const [dim, counts] of Object.entries(results) as [
    Dimension,
    { tp: number; fp: number; fn: number; tn: number },
  ][]) {
    const precision = counts.tp / (counts.tp + counts.fp || 1);
    const recall = counts.tp / (counts.tp + counts.fn || 1);
    const f1 = (2 * precision * recall) / (precision + recall || 1);
    report[dim] = { precision, recall, f1 };
    if (f1 < 0.85) allValid = false;
  }

  console.log("Calibration report:", JSON.stringify(report, null, 2));
  if (!allValid) throw new CalibrationFailedError("Judge F1 < 0.85 in one or more dimensions");
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  calibrateJudge().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
