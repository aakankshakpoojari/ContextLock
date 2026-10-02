import { AtomicClaim, ClaimDimension } from "@/types";

/**
 * Claim Decomposition & Analysis Layer
 *
 * Core Concept:
 * A statement is not monolithic. We break user-provided statements into atomic dimensions:
 * - WHAT: What event, phenomenon, or action is claimed to have occurred?
 * - WHERE: Where is this claimed to have taken place?
 * - WHEN: When is this claimed to have happened (e.g. "today", "yesterday", "2020")?
 * - WHO: Who are the entities, people, or groups involved?
 * - OTHER: Specific contextual nuances or statistical claims.
 */

export interface DecompositionResult {
  rawClaim: string;
  atomicClaims: Array<{
    type: ClaimDimension;
    text: string;
  }>;
}

/**
 * System prompt template for Gemini claim decomposition (to be wired in the pipeline)
 */
export const CLAIM_DECOMPOSITION_PROMPT = `
You are an expert investigative fact-checking agent in the ContextLock system.
Your job is to deconstruct a claim accompanying media into atomic, falsifiable sub-claims across four primary dimensions:
1. WHAT: The core occurrence, action, or physical event depicted.
2. WHERE: The specific geographical location, city, landmark, or region claimed.
3. WHEN: The time, date, period, or temporal marker claimed (e.g., "today", "just now", "during the recent storm").
4. WHO: The individuals, organizations, or actors claimed to be present or responsible.

CRITICAL INSTRUCTIONS:
- Decompose the user's assertions exactly as written.
- Do not enrich or investigate them. Do not add facts. Do not increase certainty.
- If the user's statement does not contain enough information to form a meaningful WHAT claim, omit the WHAT claim entirely.
- Do not invent generic claims such as "An event occurred", "Something happened", "The media shows something", or "An unspecified event occurred."
- Do not create a WHAT claim merely because WHERE or WHEN information exists.

Extract each atomic claim clearly without conflating dimensions.
`;

/**
 * Helper to build an empty/initial atomic claim item
 */
export function createEmptyAtomicClaim(
  dimension: ClaimDimension,
  text: string
): AtomicClaim {
  return {
    id: `claim-${dimension}-${Date.now()}`,
    type: dimension,
    claimText: text,
    status: "insufficient",
    confidenceScore: 0,
    explanation: "Awaiting evidence retrieval and verification.",
    evidenceIds: [],
  };
}
