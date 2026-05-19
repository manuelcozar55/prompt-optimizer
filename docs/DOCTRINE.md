# KERNEL Doctrine 2026

Human-readable mirror of `lib/kernel/doctrine.ts`. When in doubt, the code is authoritative.

## The Sandwich Structure
Every well-formed prompt has 8 sections, in order:

1. **role** — Who the model is acting as.
2. **context** — Project state, prior decisions, environment.
3. **instructions** — The work to perform.
4. **acceptance_criteria** — Measurable definitions of done.
5. **examples** — Few-shots. *Skip in reasoning models with deep/max effort* (Anthropic adaptive
   thinking guidance).
6. **thinking** — Output tag for reasoning trace. **NOT** a "think step by step" instruction —
   that demotes reasoning models.
7. **output_format** — Exact structure, schema, length.
8. **forbidden** — What the model must not do or output.

Source: Anthropic sandwich-structure guide, 2025.

## The 7 Domains
| Domain | When |
|---|---|
| code | Implementation, refactor, bug fix, migration |
| writing | Blog, docs, email, marketing copy |
| agentic | Multi-step, multi-tool, multi-agent orchestration |
| research | Comparative analysis, market sizing, technical evaluation |
| creative | Naming, taglines, characters, ad copy |
| analytical | Decision matrices, build-vs-buy, sensitivity analysis |

Each has a dedicated overlay in `lib/kernel/context/domain-*.ts` capturing the
discipline-specific anti-patterns and methods.

## The 7-D Binary Rubric
Each dimension is pass/fail (no 1-5 scale — calibration evidence shows binary
classifiers are more stable across judges).

| Dimension | The question |
|---|---|
| clarity | Would a domain expert without context understand exactly what is being asked? |
| specificity | Is scope, stack, metrics, deadline bounded? |
| completeness | Does it have measurable acceptance criteria? |
| groundedness | Are claims cited or labeled as assumptions? |
| testability | Can the output be automatically verified? |
| robustness | Does it defend against injection, ambiguity, edge inputs? |
| cost_efficiency | Are token count and caching proportional to value? |

Weights default to ~equal with small bumps per domain (see `WEIGHTS_BY_DOMAIN` in
`lib/kernel/rubric.ts`). Overall score thresholds:
- **≥ 85**: production
- **≥ 70**: acceptable (ship if non-critical)
- **< 70**: iterate

## Anti-patterns

### Filler vocabulary (32 items)
Words that signal AI-generated prose: `delve`, `tapestry`, `embark`, `meticulous`, `vibrant`,
`synergy`, `leverage`, `holistic`, `navigate`, `robust`, `seamless`, `unlock`, `unleash`, `empower`,
`transform`, `revolutionize`, `redefine`, `reimagine`, `cutting-edge`, `state-of-the-art`,
`groundbreaking`, `paradigm shift`, `game-changer`, `journey`, `fascinating`, `exciting`,
`intriguing`, plus phrase patterns ("in today's fast-paced world", "in the realm of", etc.).

**Bad**: "Let's delve into this robust, holistic, journey-driven approach."
**Good**: "We need a faster pipeline. Here's the plan."

### Hedging blacklist
Words that hide commitment: `could`, `might`, `possibly`, `perhaps`, `arguably`, `somewhat`,
`fairly`, `kind of`, `sort of`, `generally speaking`, `I would suggest`, etc.

**Bad**: "We could possibly consider that this might generally improve performance."
**Good**: "This will reduce p99 latency by 40%."

### Sycophancy (SycEval, arXiv 2502.08177)
Pattern matches: "you're absolutely right", "great point", "excellent question", "I totally agree".
Detected in model outputs, never accepted.

### Over-hedging (arXiv 2602.01002)
Patterns: "it depends", "there are many factors", "on the one hand... on the other hand".
A prompt is judged failing if outputs match these without bounded follow-through.

## Reasoning model handling
For Opus and Sonnet at `deep`/`max` effort, we skip the `examples` block. Source: Anthropic
adaptive thinking guidance — few-shots can distract chains-of-thought on hard reasoning tasks.

We use `output_config.effort` (not "think step by step") to scale thinking. Effort levels map
per-provider in `lib/llm/effort-mapping.ts`:

| Level | Anthropic | OpenAI |
|---|---|---|
| fast | low | minimal |
| balanced | medium | low |
| deep | high | medium |
| max | max | high |
