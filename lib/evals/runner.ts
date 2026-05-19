import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "fs";
import path from "path";
import { judgePrompt } from "./llm-judge";
import { shouldBlockMerge, writeBaseline } from "./threshold-policy";

const GOLDEN_DIR = path.join(process.cwd(), "lib/evals/golden");

interface GoldenCase {
  id: string;
  domain: string;
  output_optimal: string;
  expected_score_min: number;
  is_stretch?: boolean;
}

async function runEvals() {
  const domains = readdirSync(GOLDEN_DIR).filter((d) =>
    statSync(path.join(GOLDEN_DIR, d)).isDirectory()
  );
  const cases: GoldenCase[] = [];

  for (const domain of domains) {
    const domainDir = path.join(GOLDEN_DIR, domain);
    const files = readdirSync(domainDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      cases.push(JSON.parse(readFileSync(path.join(domainDir, file), "utf-8")) as GoldenCase);
    }
  }

  const results = await Promise.allSettled(
    cases.map(async (c) => {
      const score = await judgePrompt(c.output_optimal, c.domain, `eval_${c.id}`);
      const pass = c.is_stretch ? score.overall < 70 : score.overall >= c.expected_score_min;
      return { id: c.id, domain: c.domain, is_stretch: c.is_stretch ?? false, score: score.overall, pass };
    })
  );

  const settled = results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { pass: false, error: (r as PromiseRejectedResult).reason?.message }
  );
  const passed = settled.filter((r) => "pass" in r && r.pass).length;
  const passRate = (passed / settled.length) * 100;

  const runDir = path.join(process.cwd(), "data/eval-runs");
  mkdirSync(runDir, { recursive: true });
  writeFileSync(
    path.join(runDir, `${new Date().toISOString().replace(/[:.]/g, "-")}.json`),
    JSON.stringify({ passRate, results: settled }, null, 2)
  );

  const { block, reason } = shouldBlockMerge(passRate);
  console.log(`Pass rate: ${passRate.toFixed(1)}%`);
  if (block) {
    console.error(`BLOCK: ${reason}`);
    process.exit(1);
  }

  writeBaseline(passRate);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runEvals().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
