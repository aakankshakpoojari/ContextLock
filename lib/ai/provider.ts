if (typeof window !== "undefined") {
  throw new Error("AI provider orchestrator must never be executed in client-side code.");
}

import {
  MediaObservations,
  MediaObservationInput,
  AtomicClaim,
  EvidenceSource,
  SyntheticMediaAnalysis,
} from "@/types";
import {
  AIProviderResponse,
  ReasoningResult,
  StructuredGenerationOptions,
} from "./types";
import { geminiProvider } from "./gemini";
import { grokProvider } from "./grok";

/**
 * Sanitizes error messages to ensure no tokens, keys, or credentials can leak into logs or errors.
 */
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
      .replace(/key=[a-zA-Z0-9_-]+/gi, "key=[REDACTED]")
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED]");
  }
  return String(error);
}

/**
 * Returns the active provider strategy configuration.
 * - "gemini": Force Gemini primary only (dev testing)
 * - "grok": Force Grok only (dev testing fallback without breaking Gemini)
 * - "auto" (default): Try Gemini primary, seamlessly fallback to Grok on failure
 */
export function getProviderStrategy(): "auto" | "gemini" | "grok" {
  const envVal = (process.env.AI_PROVIDER || "auto").trim().toLowerCase();
  if (envVal === "grok") return "grok";
  if (envVal === "gemini") return "gemini";
  return "auto";
}

/**
 * Generic orchestrator executor with automated fallback and latency tracking.
 */
async function executeWithFallback<T>(
  taskName: string,
  executeGemini: () => Promise<{ data: T; model: string }>,
  executeGrok: () => Promise<{ data: T; model: string }>
): Promise<AIProviderResponse<T>> {
  const strategy = getProviderStrategy();
  const startTime = Date.now();

  // 1. Direct Grok override for development / testing
  if (strategy === "grok") {
    console.log(`[AI Orchestrator] [${taskName}] AI provider: Grok (forced by AI_PROVIDER=grok)`);
    const grokResult = await executeGrok();
    return {
      data: grokResult.data,
      provider: "grok",
      model: grokResult.model,
      latencyMs: Date.now() - startTime,
    };
  }

  // 2. Direct Gemini override for development / testing
  if (strategy === "gemini") {
    console.log(`[AI Orchestrator] [${taskName}] AI provider: Gemini (forced by AI_PROVIDER=gemini)`);
    const geminiResult = await executeGemini();
    return {
      data: geminiResult.data,
      provider: "gemini",
      model: geminiResult.model,
      latencyMs: Date.now() - startTime,
    };
  }

  // 3. Default "auto" strategy: Try Gemini primary, fallback to Grok on failure
  let geminiError: unknown = null;

  try {
    console.log(`[AI Orchestrator] [${taskName}] AI provider: Gemini (primary)`);
    const geminiResult = await executeGemini();
    return {
      data: geminiResult.data,
      provider: "gemini",
      model: geminiResult.model,
      latencyMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    geminiError = err;
    const sanitizedMsg = sanitizeError(err);
    console.warn(
      `[AI Orchestrator] [${taskName}] Gemini failed: ${sanitizedMsg}. Attempting Grok fallback...`
    );
  }

  // Check if Grok is available
  if (!grokProvider.isAvailable()) {
    console.error(
      `[AI Orchestrator] [${taskName}] Grok fallback unavailable (GROK_API_KEY is not configured).`
    );
    throw new Error(
      `Primary AI provider (Gemini) failed and fallback provider (Grok) is not configured. Gemini error: ${sanitizeError(geminiError)}`
    );
  }

  // Attempt Grok fallback
  try {
    console.log(`[AI Orchestrator] [${taskName}] AI provider: Grok fallback`);
    const grokResult = await executeGrok();
    return {
      data: grokResult.data,
      provider: "grok",
      model: grokResult.model,
      latencyMs: Date.now() - startTime,
    };
  } catch (grokErr: unknown) {
    const sanitizedGrokMsg = sanitizeError(grokErr);
    console.error(
      `[AI Orchestrator] [${taskName}] Both Gemini and Grok providers failed. Gemini: ${sanitizeError(geminiError)} | Grok: ${sanitizedGrokMsg}`
    );
    throw new Error(
      `AI analysis failed across all providers. [Gemini]: ${sanitizeError(geminiError)} | [Grok]: ${sanitizedGrokMsg}`
    );
  }
}

/**
 * Analyzes multimodal media with Gemini primary and Grok fallback.
 */
export async function analyzeMedia(
  input: MediaObservationInput,
  options?: { model?: string }
): Promise<AIProviderResponse<MediaObservations>> {
  return executeWithFallback(
    "analyzeMedia",
    () => geminiProvider.analyzeMedia(input, options),
    () => grokProvider.analyzeMedia(input, options)
  );
}

/**
 * Performs forensic analysis for synthetic / AI-generation indicators with Gemini primary and Grok fallback.
 */
export async function analyzeSyntheticMedia(
  input: MediaObservationInput,
  options?: { model?: string }
): Promise<AIProviderResponse<SyntheticMediaAnalysis>> {
  return executeWithFallback(
    "analyzeSyntheticMedia",
    () => geminiProvider.analyzeSyntheticMedia(input, options),
    () => grokProvider.analyzeSyntheticMedia(input, options)
  );
}

/**
 * Decomposes user claims into atomic WHAT, WHERE, WHEN, WHO dimensions.
 */
export async function decomposeClaims(
  claimText: string,
  options?: { model?: string }
): Promise<AIProviderResponse<AtomicClaim[]>> {
  return executeWithFallback(
    "decomposeClaims",
    () => geminiProvider.decomposeClaims(claimText, options),
    () => grokProvider.decomposeClaims(claimText, options)
  );
}

/**
 * Evaluates claims against retrieved evidence with Gemini primary and Grok fallback.
 */
export async function analyzeEvidence(
  claim: AtomicClaim,
  evidence: EvidenceSource[],
  relatedClaims: AtomicClaim[] = [],
  options?: { model?: string }
): Promise<AIProviderResponse<ReasoningResult>> {
  return executeWithFallback(
    "analyzeEvidence",
    () => geminiProvider.analyzeEvidence(claim, evidence, relatedClaims, options),
    () => grokProvider.analyzeEvidence(claim, evidence, relatedClaims, options)
  );
}

/**
 * Generic structured generation helper with Gemini primary and Grok fallback.
 */
export async function generateStructured<T>(
  params: StructuredGenerationOptions<T>
): Promise<AIProviderResponse<T>> {
  return executeWithFallback(
    "generateStructured",
    () => geminiProvider.generateStructured(params),
    () => grokProvider.generateStructured(params)
  );
}

/**
 * Returns provider availability diagnostic status.
 */
export function getAIProviderStatus() {
  return {
    strategy: getProviderStrategy(),
    geminiAvailable: geminiProvider.isAvailable(),
    grokAvailable: grokProvider.isAvailable(),
    primaryProvider: "gemini" as const,
    fallbackProvider: "grok" as const,
  };
}
