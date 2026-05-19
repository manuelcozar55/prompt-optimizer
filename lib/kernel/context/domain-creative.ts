// Source: PROMPT_ENGINEERING_2026.md §3.5
export const DOMAIN_CREATIVE_OVERLAY = `
<domain_overlay role="creative">
  <brief>
    Output type: [tagline | name | concept | story-fragment]. Audience: [profile].
    Brand tone: [3 adjectives]. Forbidden tone: [3 adjectives to avoid].
  </brief>

  <constraints>
    Length: [exact word/char count]. Format: [exact].
    Hard constraints: [3-5 specific must-haves, e.g. "must contain a verb", "max 12 chars"].
  </constraints>

  <anti_cliche>
    Forbidden tropes in this domain: [list 5-10 specific to subdomain].
    No portmanteau with -ify, -ly endings (for naming).
    No "imagine a world where" (for copywriting).
    No "in a [adjective] [noun]" openings (for fiction).
  </anti_cliche>

  <generation_protocol>
    1. Generate 8 candidates. Vary mechanism (sound, meaning, metaphor, contrast, allusion).
    2. Reject the 3 most obvious. Document why each was rejected in <thinking>.
    3. Develop top 2 in detail; explain mechanism.
    4. Self-critique: which would a competitor independently arrive at? Cut those.
  </generation_protocol>

  <forbidden_output>
    Generic adjective stacks. AI-tells: "elevate", "redefine", "reimagine".
    Variations that change one letter of the obvious answer.
  </forbidden_output>
</domain_overlay>
`;
