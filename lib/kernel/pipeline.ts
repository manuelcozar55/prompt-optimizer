import { sanitizeUserPrompt } from "../llm/sanitize";
import { classifyDomain } from "./agents/analyzer";
import { getAntipatternSummary } from "./antipatterns";
import { judgePrompt } from "./agents/judge";
import { critiquePrompt } from "./agents/critic";
import { improvePrompt } from "./agents/improver";
import { guardBudget, estimateCost } from "../llm/budget-guard";
import { compactHistory } from "./context/compaction";
import { buildUniversalSandwich } from "./context/universal";
import { DOMAIN_CODE_OVERLAY } from "./context/domain-code";
import { DOMAIN_WRITING_OVERLAY } from "./context/domain-writing";
import { DOMAIN_AGENTIC_OVERLAY } from "./context/domain-agentic";
import { DOMAIN_RESEARCH_OVERLAY } from "./context/domain-research";
import { DOMAIN_CREATIVE_OVERLAY } from "./context/domain-creative";
import { DOMAIN_ANALYTICAL_OVERLAY } from "./context/domain-analytical";
import { HEDGING_BLACKLIST } from "./doctrine";
import { MODELS } from "../llm/models";
import { routeCall } from "../llm/router";
import type { PipelineEvent } from "../llm/streaming";
import type { RubricScore } from "./rubric";

const DOMAIN_OVERLAYS: Record<string, string> = {
  code: DOMAIN_CODE_OVERLAY,
  writing: DOMAIN_WRITING_OVERLAY,
  agentic: DOMAIN_AGENTIC_OVERLAY,
  research: DOMAIN_RESEARCH_OVERLAY,
  creative: DOMAIN_CREATIVE_OVERLAY,
  analytical: DOMAIN_ANALYTICAL_OVERLAY,
};

export interface PipelineInput {
  prompt: string;
  effort: "fast" | "balanced" | "deep" | "max";
  tournament: boolean;
  maxBudgetUsd?: number;
  domainOverride?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface PipelineOptions {
  traceId: string;
  onEvent: (event: PipelineEvent) => void;
}

export interface PipelineResult {
  optimizedPrompt: string;
  initialScore: RubricScore;
  finalScore: RubricScore;
  domain: string;
  domainConfidence: number;
  antipatterns: ReturnType<typeof getAntipatternSummary>;
  totalCostUsd: number;
  totalTokens: number;
  tournament?: TournamentResult;
}

export interface TournamentResult {
  winner: string;
  results: Array<{ model: string; output: string; score: RubricScore }>;
}

function emptyTokens() {
  return { in: 0, out: 0, cached_read: 0, cached_write: 0 };
}

function replaceHedging(text: string): string {
  let out = text;
  for (const h of HEDGING_BLACKLIST) {
    const re = new RegExp(`\\b${h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    out = out.replace(re, "");
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

async function runWithModel(
  prompt: string,
  modelId: string,
  traceId: string
): Promise<{ output: string; score: RubricScore }> {
  const response = await routeCall({
    modelId,
    system: "Execute the following prompt and return ONLY the deliverable output.",
    messages: [{ role: "user", content: prompt }],
    effort: "deep",
    traceId,
  });

  let output = "";
  const r = response as unknown as {
    content?: Array<{ type: string; text?: string }>;
    choices?: Array<{ message?: { content?: string } }>;
  };
  if (r.content) {
    output = r.content.find((b) => b.type === "text")?.text ?? "";
  } else if (r.choices) {
    output = r.choices[0]?.message?.content ?? "";
  }

  const score = await judgePrompt(output, "code", traceId + "_judge");
  return { output, score };
}

export async function runPipeline(
  input: PipelineInput,
  options: PipelineOptions
): Promise<PipelineResult> {
  const { traceId, onEvent } = options;
  let totalCostUsd = 0;
  let totalTokens = 0;

  // ===== PHASE 1: PARSE & DETECT =====
  onEvent({
    phase: 1,
    status: "running",
    partial: "Sanitize + classify + detect antipatterns",
    tokens: emptyTokens(),
    cost_usd: 0,
    latency_ms: 0,
  });

  const sanitized = sanitizeUserPrompt(input.prompt);
  const start1 = Date.now();
  const [classification, antipatterns, initialScore] = await Promise.all([
    classifyDomain(sanitized, traceId + "_classify"),
    Promise.resolve(getAntipatternSummary(input.prompt)),
    judgePrompt(sanitized, input.domainOverride ?? "code", traceId + "_judge_initial"),
  ]);
  const domain = input.domainOverride ?? classification.domain;
  const confidence = classification.confidence;
  totalCostUsd += estimateCost(MODELS.HAIKU, 200, 100) + estimateCost(MODELS.OPUS, 500, 500);
  totalTokens += 1300;

  onEvent({
    phase: 1,
    status: "ok",
    partial: `domain=${domain} confidence=${confidence.toFixed(2)} initial_score=${initialScore.overall}`,
    tokens: emptyTokens(),
    cost_usd: totalCostUsd,
    latency_ms: Date.now() - start1,
    data: { domain, confidence, antipatterns, initialScore },
  });

  // ===== PHASE 2: CONTEXT BUDGET =====
  const start2 = Date.now();
  let history = input.history ?? [];
  if (history.length > 30) {
    history = await compactHistory(history, 30);
  }
  onEvent({
    phase: 2,
    status: "ok",
    partial: `history compaction: ${input.history?.length ?? 0} -> ${history.length} turns`,
    tokens: emptyTokens(),
    cost_usd: 0,
    latency_ms: Date.now() - start2,
  });

  // ===== PHASE 3: ENRICH =====
  const start3 = Date.now();
  const sandwich = buildUniversalSandwich(domain, input.effort, MODELS.SONNET);
  const cleaned = replaceHedging(input.prompt);
  const enrichedPrompt = `${sandwich}\n\n<user_input_to_optimize>\n${cleaned}\n</user_input_to_optimize>`;
  onEvent({
    phase: 3,
    status: "ok",
    partial: `sandwich applied; hedging removed`,
    tokens: emptyTokens(),
    cost_usd: 0,
    latency_ms: Date.now() - start3,
  });

  // ===== PHASE 4: DOMAIN OVERLAY =====
  const start4 = Date.now();
  const overlay = DOMAIN_OVERLAYS[domain] ?? DOMAIN_OVERLAYS.code;
  let currentPrompt = `${overlay}\n\n${enrichedPrompt}`;

  if (confidence < 0.7) {
    onEvent({
      phase: 4,
      status: "await_override",
      partial: `low confidence (${confidence.toFixed(2)}) — domain=${domain}; user override available`,
      tokens: emptyTokens(),
      cost_usd: 0,
      latency_ms: Date.now() - start4,
      data: { domain, confidence },
    });
  } else {
    onEvent({
      phase: 4,
      status: "ok",
      partial: `overlay=${domain}`,
      tokens: emptyTokens(),
      cost_usd: 0,
      latency_ms: Date.now() - start4,
    });
  }

  // ===== PHASE 5: SELF-CRITIQUE LOOP =====
  let finalScore = initialScore;
  let iter = 0;
  let prevScore = initialScore.overall;

  while (iter < 3) {
    const start5 = Date.now();
    onEvent({
      phase: 5,
      status: "running",
      partial: `critique iter ${iter + 1}/3`,
      tokens: emptyTokens(),
      cost_usd: totalCostUsd,
      latency_ms: 0,
    });

    const currentScore = await judgePrompt(currentPrompt, domain, traceId + `_judge_${iter}`);
    totalCostUsd += estimateCost(MODELS.OPUS, 500, 500);
    totalTokens += 1000;

    if (currentScore.overall >= 85) {
      finalScore = currentScore;
      onEvent({
        phase: 5,
        status: "ok",
        partial: `converged at ${currentScore.overall}`,
        tokens: emptyTokens(),
        cost_usd: totalCostUsd,
        latency_ms: Date.now() - start5,
      });
      break;
    }

    const feedback = await critiquePrompt(currentPrompt, traceId + `_critic_${iter}`);
    totalCostUsd += estimateCost(MODELS.OPUS, 500, 800);
    totalTokens += 1300;

    const improved = await improvePrompt(
      currentPrompt,
      feedback.join("\n"),
      traceId + `_improve_${iter}`
    );
    totalCostUsd += estimateCost(MODELS.SONNET, 1000, 1500);
    totalTokens += 2500;

    const newScore = await judgePrompt(improved, domain, traceId + `_judge_after_${iter}`);
    totalCostUsd += estimateCost(MODELS.OPUS, 500, 500);
    totalTokens += 1000;

    if (newScore.overall - prevScore < 2) {
      onEvent({
        phase: 5,
        status: "ok",
        partial: `early-break: non-progress (delta=${(newScore.overall - prevScore).toFixed(1)})`,
        tokens: emptyTokens(),
        cost_usd: totalCostUsd,
        latency_ms: Date.now() - start5,
      });
      currentPrompt = improved;
      finalScore = newScore;
      break;
    }

    prevScore = newScore.overall;
    currentPrompt = improved;
    finalScore = newScore;
    iter++;

    onEvent({
      phase: 5,
      status: "ok",
      partial: `iter ${iter} score=${newScore.overall}`,
      tokens: emptyTokens(),
      cost_usd: totalCostUsd,
      latency_ms: Date.now() - start5,
    });
  }

  // ===== PHASE 6: TOURNAMENT (optional) =====
  let tournament: TournamentResult | undefined;
  if (input.tournament) {
    const start6 = Date.now();
    const cap = input.maxBudgetUsd ?? 0.5;
    try {
      guardBudget({ in: 5000, out: 2000 }, MODELS.OPUS, cap);
    } catch (e) {
      onEvent({
        phase: 6,
        status: "error",
        partial: (e as Error).message,
        tokens: emptyTokens(),
        cost_usd: totalCostUsd,
        latency_ms: Date.now() - start6,
      });
      throw e;
    }

    onEvent({
      phase: 6,
      status: "running",
      partial: "running 3 models in parallel",
      tokens: emptyTokens(),
      cost_usd: totalCostUsd,
      latency_ms: 0,
    });

    const [opusResult, sonnetResult, gptResult] = await Promise.all([
      runWithModel(currentPrompt, MODELS.OPUS, traceId + "_opus"),
      runWithModel(currentPrompt, MODELS.SONNET, traceId + "_sonnet"),
      runWithModel(currentPrompt, MODELS.GPT, traceId + "_gpt"),
    ]);
    totalCostUsd += 0.15;
    totalTokens += 15000;

    const results = [
      { model: MODELS.OPUS, ...opusResult },
      { model: MODELS.SONNET, ...sonnetResult },
      { model: MODELS.GPT, ...gptResult },
    ];
    const winner = results.reduce((a, b) => (a.score.overall >= b.score.overall ? a : b));
    tournament = { winner: winner.model, results };

    onEvent({
      phase: 6,
      status: "ok",
      partial: `winner=${winner.model} score=${winner.score.overall}`,
      tokens: emptyTokens(),
      cost_usd: totalCostUsd,
      latency_ms: Date.now() - start6,
      data: { winner: winner.model },
    });
  } else {
    onEvent({
      phase: 6,
      status: "skipped",
      partial: "tournament disabled",
      tokens: emptyTokens(),
      cost_usd: totalCostUsd,
      latency_ms: 0,
    });
  }

  return {
    optimizedPrompt: currentPrompt,
    initialScore,
    finalScore,
    domain,
    domainConfidence: confidence,
    antipatterns,
    totalCostUsd,
    totalTokens,
    tournament,
  };
}

void runWithModel;
