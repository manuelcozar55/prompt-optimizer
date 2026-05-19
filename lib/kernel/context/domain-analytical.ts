// Source: PROMPT_ENGINEERING_2026.md §3.6
export const DOMAIN_ANALYTICAL_OVERLAY = `
<domain_overlay role="analytical">
  <problem_framing>
    Decision to make: [exact decision]. Decider: [who chooses]. Deadline: [when].
    What success looks like: [measurable criterion].
  </problem_framing>

  <assumptions>
    List 5+ assumptions you are making. For each: confidence (high/med/low) and how you would verify.
  </assumptions>

  <method>
    1. Frame: state the decision and the option space (3-5 alternatives, including "do nothing").
    2. Criteria: 3-5 weighted decision criteria.
    3. Evaluate each option against criteria; show scores.
    4. Sensitivity: which assumption, if wrong, flips the recommendation?
    5. Red team: strongest argument against your recommendation. Address it.
  </method>

  <output_format>
    Recommendation (1 sentence). Top 2 alternatives (1 sentence each, with trade-off).
    Decision matrix (table). Key uncertainties. Recommended next step (concrete action).
  </output_format>

  <forbidden>
    "It depends" without specifying on what. False precision (3 decimal places on rough estimates).
    Recommending options not previously surfaced in the option space.
    Recommendations that don't reduce to a concrete action.
  </forbidden>
</domain_overlay>
`;
