# CLAUDE.md — KERNEL Optimizer v3 contract

## What this repo is
A production prompt optimizer. User submits a vague prompt; we return an engineered prompt with
score, diff, antipattern detection, and (optionally) a 3-model tournament comparison.

## Hard rules
1. **Use `pnpm` only.** Never npm. Run via `/root/.local/node20/bin/pnpm` if node is < 20.
2. **Model strings are pinned** in `lib/llm/models.ts`. Never inline a model id elsewhere.
3. **No LangChain, no Instructor, no DSPy at runtime.** Custom-first pipeline. See ARCHITECTURE.md
   for the rationale.
4. **All user input passes through `lib/llm/sanitize.ts`** before reaching the pipeline.
5. **The rubric is binary pass/fail per dimension.** Never a 1-5 scale.
6. **No "think step by step" in prompts to reasoning models.** Use `output_config.effort` via
   `lib/llm/effort-mapping.ts`.

## Pipeline contract
6 named phases, SSE-streamed. Each emits `{phase, status, partial, tokens, cost_usd, latency_ms}`.
See `lib/kernel/pipeline.ts` for the source of truth.

## Where to look
- `lib/kernel/doctrine.ts` — constants (sandwich, blacklists, regexes). Cite sources in comments.
- `lib/kernel/rubric.ts` — 7-D scoring + per-domain weights.
- `lib/kernel/context/` — universal sandwich + 6 domain overlays.
- `lib/kernel/agents/` — analyzer, improver, critic, judge.
- `lib/kernel/pipeline.ts` — phase orchestrator.
- `lib/llm/` — provider adapters, router, sanitization, budget guard, cache strategy.
- `lib/evals/` — golden suite, judge calibration, threshold policy, runner.
- `app/api/` — optimize (SSE), score, tournament, foldback, admin endpoints.
- `app/(web)/` — UI route group (Editor, History, Evals, Admin).
- `components/` — UI primitives + higher-level (PipelineTrace, ScoreRadar, DiffViewer).

## Commands
- `pnpm dev` — dev server on :3000
- `pnpm build` — production build (standalone output for Docker)
- `pnpm typecheck` — strict TypeScript
- `pnpm test` — Vitest unit tests
- `pnpm test:evals` — run golden suite against current pipeline (requires API keys)
- `pnpm calibrate-judge` — recompute judge precision/recall vs human labels
- `pnpm db:generate` / `pnpm db:migrate` — Drizzle migrations

## Ship gate
Type-check pass + unit tests pass + build success. Eval pass-rate cannot drop > 5pp from baseline
(see `lib/evals/threshold-policy.ts`).
