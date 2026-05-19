# KERNEL v3 — Architecture

## Stack
- Next.js 15+ App Router (route groups for web pages; API routes for SSE pipeline)
- TypeScript strict mode, target ES2022
- Drizzle ORM + better-sqlite3 (local-first persistence; WAL mode)
- Anthropic SDK + OpenAI SDK for LLM calls (pinned model strings in `lib/llm/models.ts`)
- Pino for structured logging
- Tailwind CSS v4 + dark mode by default
- recharts for radar charts; react-diff-viewer-continued for prompt diffs
- Vitest for unit tests
- Drizzle Kit for migrations
- promptfoo for red-team prompt-injection coverage

## Why no LangChain / Instructor / DSPy at runtime
Following Anthropic's "Building Effective Agents" doctrine: when the orchestration flow is known
ahead of time, hand-written code is simpler to debug, cheaper to run, and easier to evolve than
a generic framework. Our pipeline is exactly 6 named phases with a deterministic event stream;
this is custom-first territory.

Instructor/BAML are unnecessary because Zod provides structured-output parsing with retry, and our
schemas are small.

DSPy/GEPA are reserved for an offline optimization job (Modal Python endpoint, queued via the
`/api/admin/optimize-master-prompt` route). They never run inline in user requests.

## Cache strategy
Two cache TTLs:
- Doctrine + domain overlay: 1 hour (high reuse across sessions).
- Conversation history: 5 minutes (short-lived, low reuse).

Breakpoint is set on the system prompt (`messages[0]`) and the first non-cached overlay. Metrics
exposed via `/api/admin/cache-metrics`: hit-rate, write/read ratio, with an alert if
`write/read > 0.2` (indicates cache is being invalidated too aggressively).

## Sanitization model
User input is sanitized via `lib/llm/sanitize.ts`. Two layers:
1. **Spotlighting**: every user prompt is wrapped in `<user_input_to_optimize>` tags before being
   added to the message stream.
2. **Tag escaping**: occurrences of sandwich tags inside the user content (e.g., `</system>`,
   `</instructions>`) are HTML-escaped so they cannot break out of the wrapper.

A `TOOL_INJECTION_GUARD` constant is injected into every agent system prompt instructing the
model to treat content inside the wrapper as data, not commands.

## Calibration policy
The LLM-as-judge is calibrated against 30 human-labeled examples (one per golden case). Calibration
runs precision/recall/F1 per dimension. **Gate: F1 ≥ 0.85 on every dimension to ship.** The judge
is the same model (Opus, deep effort, temperature 0) for determinism.

## Eval threshold policy
After each run on the golden suite, pass-rate is persisted to `data/eval-baseline.json`. If a new
run's pass-rate drops more than 5 percentage points from the baseline, the run blocks the merge.
Otherwise the new pass-rate becomes the new baseline.

## Pipeline phases (the contract)
1. **Parse & Detect** — sanitize, classify domain, detect antipatterns, baseline judge score.
2. **Context Budget** — compact history > 30 turns.
3. **Enrich** — apply sandwich structure, strip hedging.
4. **Domain Overlay** — apply the matched domain overlay; if confidence < 0.7, emit
   `await_override` event for the UI to surface a domain picker.
5. **Self-Critique** — up to 3 iterations of judge → critic → improver. Break early on:
   - convergence (score ≥ 85)
   - non-progress (Δ < 2 points)
6. **Tournament (optional)** — run the optimized prompt across 3 models (Opus, Sonnet, GPT-5-4)
   in parallel; pick the winner by judge score.

Each phase emits an SSE event with `{phase, status, partial, tokens, cost_usd, latency_ms}`.

## Why this is greenfield, not LangGraph/Mastra
We need: (a) deterministic event order, (b) per-phase cost accounting, (c) early-break heuristics
tuned to our domain. The state machine is small (6 nodes) and the transitions are simple. A graph
framework adds runtime overhead and dependency surface for no gain.
