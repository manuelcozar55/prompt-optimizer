// Source: PROMPT_ENGINEERING_2026.md §3.1
export const DOMAIN_CODE_OVERLAY = `
<domain_overlay role="code">
  <tech_stack required="true">
    Declare: language, framework, runtime version, key libraries.
  </tech_stack>

  <constraints>
    <performance>State expected complexity (e.g. O(n log n)) and memory ceiling.</performance>
    <style>Follow existing project conventions (read 2-3 sample files first if available).</style>
    <testing>Tests-first: write failing tests, then implementation.</testing>
  </constraints>

  <approach>
    1. Read related code and conventions before proposing changes.
    2. Plan: list files to edit, functions to add/modify, tests to write.
    3. Implement smallest surgical change that satisfies all acceptance criteria.
    4. Run tests; iterate until green.
    5. Self-review: did this break adjacent functionality? What edge cases missed?
  </approach>

  <output_format>
    - Diff in unified format (only changed hunks).
    - List of files touched with rationale.
    - Test output (pasted or summarized).
    - Remaining risks / TODOs.
  </output_format>

  <forbidden>
    - Hedging ("this might work", "could be improved").
    - Mock-style implementations claiming completion.
    - Adding dependencies without justification.
  </forbidden>
</domain_overlay>
`;
