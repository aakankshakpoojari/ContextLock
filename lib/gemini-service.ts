import "server-only";
import { getGeminiClient, GEMINI_MODELS } from "./gemini";
import {
  MediaObservations,
  MediaObservationsSchema,
  MediaObservationInput,
  AtomicClaim,
} from "@/types";
import { z } from "zod";
import { CLAIM_DECOMPOSITION_PROMPT, createEmptyAtomicClaim } from "./claims";

/**
 * ContextLock Gemini Service Layer
 * Track: Trust in a Synthetic World (Google Gemini Hack Days 2026)
 *
 * Architecture Principles:
 * - Server-only execution (never invoked from client components).
 * - Gemini acts as the multimodal perception and analytical reasoning engine.
 * - OBSERVATIONS ARE SEPARATED FROM CONCLUSIONS:
 *   Gemini identifies observable facts and clues without deciding overall truth.
 * - External evidence retrieval remains a distinct downstream stage.
 */

export const MEDIA_OBSERVATION_SYSTEM_PROMPT = `
You are the objective media perception module for ContextLock, an investigative verification platform.
Your responsibility is strictly to record factual, verifiable visual and audio observations from the provided input.

CRITICAL INSTRUCTIONS:
1. SEPARATE OBSERVATION FROM CONCLUSION:
   - Record ONLY what is directly observable in the media.
   - NEVER declare whether the media is "real", "fake", "authentic", "manipulated", or "verified".
   - Do not claim that an event actually happened or is true simply because it appears in the media.
2. EXTRACT OBJECTIVE CLUES:
   - visibleText: exact transcriptions of visible signs, store names, vehicle plates, banners, captions, watermarks.
   - locationClues: recognizable architecture, road markings, landscape, language on signs, geographic indicators.
   - timeClues: daylight/sun position, shadows, weather, clothing era, vehicle generation, season.
   - notableDetails: notable background elements, physical interactions, camera artifacts, anomalies.
3. OUTPUT FORMAT:
   - Output valid JSON strictly conforming to the requested schema.
`;

export const MEDIA_OBSERVATIONS_JSON_SCHEMA = {
  type: "object",
  properties: {
    observations: {
      type: "array",
      items: { type: "string" },
      description: "Direct factual observations of what is visible or audible in the media",
    },
    visibleText: {
      type: "array",
      items: { type: "string" },
      description: "Transcriptions of any visible text, road signs, storefronts, or banners",
    },
    locationClues: {
      type: "array",
      items: { type: "string" },
      description: "Identifiable geographic clues, architecture, signs, or regional indicators",
    },
    timeClues: {
      type: "array",
      items: { type: "string" },
      description: "Identifiable temporal clues such as daylight, weather, seasonal cues, or era markers",
    },
    notableDetails: {
      type: "array",
      items: { type: "string" },
      description: "Notable specific elements, potential anomalies, artifacts, or distinctive items",
    },
  },
  required: [
    "observations",
    "visibleText",
    "locationClues",
    "timeClues",
    "notableDetails",
  ],
};

/**
 * 1. analyzeMedia()
 * Analyzes multimodal media inputs (or textual descriptions of media)
 * and extracts structured, objective observations without jumping to conclusions.
 */
export async function analyzeMedia(
  input: MediaObservationInput,
  options?: { model?: string; onModelUsed?: (model: string) => void }
): Promise<MediaObservations> {
  const client = getGeminiClient();
  const model = options?.model || GEMINI_MODELS.DEFAULT;

  // Prepare multimodal contents array conforming to @google/genai SDK
  // Supports both inline media parts (base64) and file URIs
  const contents: Array<
    | string
    | { inlineData: { mimeType: string; data: string } }
    | { fileData: { fileUri: string; mimeType?: string } }
  > = [];

  if (input.mediaParts && input.mediaParts.length > 0) {
    for (const part of input.mediaParts) {
      if (part.inlineData) {
        contents.push({
          inlineData: {
            mimeType: part.inlineData.mimeType,
            data: part.inlineData.data,
          },
        });
      } else if (part.fileUri) {
        contents.push({
          fileData: {
            fileUri: part.fileUri,
          },
        });
      }
    }
  }

  const promptText =
    input.textPrompt && input.textPrompt.trim() !== ""
      ? input.textPrompt
      : "Analyze the provided media and extract objective, verifiable observations without forming conclusions.";

  contents.push(promptText);

  let response;
  let activeModel = model;

  try {
    response = await client.models.generateContent({
      model: activeModel,
      contents,
      config: {
        systemInstruction: MEDIA_OBSERVATION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: MEDIA_OBSERVATIONS_JSON_SCHEMA,
      },
    });
  } catch (err: unknown) {
    const errString = String(err);
    // If primary model encounters high demand (503 / UNAVAILABLE), fall back to FAST model
    if (
      (errString.includes("503") ||
        errString.includes("UNAVAILABLE") ||
        errString.includes("high demand")) &&
      activeModel !== GEMINI_MODELS.FAST
    ) {
      console.warn(
        `[ContextLock] Model ${activeModel} experiencing high demand; falling back to ${GEMINI_MODELS.FAST}.`
      );
      activeModel = GEMINI_MODELS.FAST;
      response = await client.models.generateContent({
        model: activeModel,
        contents,
        config: {
          systemInstruction: MEDIA_OBSERVATION_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: MEDIA_OBSERVATIONS_JSON_SCHEMA,
        },
      });
    } else {
      throw err;
    }
  }

  const rawText = response.text;
  if (!rawText) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    throw new Error(
      `Failed to parse Gemini response as JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  options?.onModelUsed?.(activeModel);

  // Validate structured shape against Zod schema
  return MediaObservationsSchema.parse(parsed);
}

export const SYNTHETIC_ANALYSIS_SYSTEM_PROMPT = `
  You are the Synthetic Media Forensics perception engine for ContextLock, an investigative verification platform.
  Your task is to inspect the provided image or video frames for observable technical anomalies or indicators 
characteristic of generative AI synthesis, deepfakes, face swapping, diffusion model artifacts, or digital tampering.
  
  CRITICAL PRINCIPLES:
  1. SEPARATE OBSERVATION FROM CONCLUSION:
     - Carefully record specific, observable physical, optical, and anatomical indicators.
     - Differentiate between:
       a) OBSERVATION (e.g., "Irregular pupil geometry and asymmetrical reflections in right eye")
       b) CONCLUSION (e.g., "This image is AI-generated")
     - Do NOT declare absolute or definitive scientific certainty (never state "100% fake", "proven AI", or 
"definitely authentic").
     - Frame the status strictly as:
       * "synthetic_indicators" (observable anomalies consistent with generative AI / synthetic media are present)
       * "no_strong_indicators" (no obvious generative anomalies or tampering cues detected on visual inspection)
       * "inconclusive" (media quality, heavy compression, low resolution, or ambiguity prevents clear determination)
  
  2. FORENSIC CATEGORIES TO INSPECT:
     - visual_artifact: Unnatural blurring, pixelation boundaries, diffusion melting, repeating texture patterns, edge halos.
     - facial_consistency: Unnatural skin texture (over-smoothed waxy look), blending at hair/ears, irregular teeth/eyes, pupil shape inconsistencies.
     - lighting: Illogical light sources, inconsistent shadow angles, missing contact shadows.
     - geometry: Impossible perspective lines, distorted architectural angles, warped background objects.
     - text: Malformed, gibberish, or pseudoglyphic text rendering common in image generators.
     - reflection: Inconsistent catchlights in eyes, missing or conflicting reflections on wet/shiny surfaces or mirrors.
     - temporal_consistency: (For video) Frame-to-frame warping, morphing, jittering boundaries, identity drift across frames.
     - audio_visual: (If audio present) Desynchronized lip movement, robotic timbre, unnatural cadence.
     - other: Any other distinct physical or digital anomalies.
  
  3. BALANCED EXPLANATION:
     - Provide a measured, objective summary of the analysis explaining why the status and confidence were assigned.
     - If genuine compression or camera artifacts might explain the observation, note that clearly.
`;

export const SYNTHETIC_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    status: {
      type: "string",
      enum: ["synthetic_indicators", "no_strong_indicators", "inconclusive"],
      description: "Forensic assessment category",
    },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
      description: "Confidence level of the assessment based on visual clarity and signal strength",
    },
    indicators: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "visual_artifact",
              "facial_consistency",
              "lighting",
              "geometry",
              "text",
              "reflection",
              "temporal_consistency",
              "audio_visual",
              "other",
            ],
          },
          observation: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["category", "observation", "severity"],
      },
      description: "List of observable forensic clues or anomalies detected",
    },
    explanation: {
      type: "string",
      description: "Objective explanation of the forensic analysis",
    },
  },
  required: ["status", "confidence", "indicators", "explanation"],
};

export const CLAIM_DECOMPOSITION_JSON_SCHEMA = {
  type: "object",
  properties: {
    claims: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["what", "where", "when", "who", "other"] },
          text: { type: "string" },
        },
        required: ["type", "text"],
      },
    },
  },
  required: ["claims"],
};

const GeminiDecompositionSchema = z.object({
  claims: z.array(
    z.object({
      type: z.enum(["what", "where", "when", "who", "other"]),
      text: z.string(),
    })
  ),
});

/**
 * 2. decomposeClaims()
 * Breaks claims into atomic WHAT, WHERE, WHEN, WHO dimensions.
 */
export async function decomposeClaims(
  claimText: string,
  options?: { model?: string; onModelUsed?: (model: string) => void }
): Promise<AtomicClaim[]> {
  const client = getGeminiClient();
  const model = options?.model || GEMINI_MODELS.DEFAULT;

  const promptText = `Decompose the following user claim into independently verifiable atomic claims. Do not invent new facts. Split compound claims if needed. If no factual claim is made, return an empty array.\n\nUSER CLAIM: "${claimText}"`;

  let response;
  let activeModel = model;

  try {
    response = await client.models.generateContent({
      model: activeModel,
      contents: [promptText],
      config: {
        systemInstruction: CLAIM_DECOMPOSITION_PROMPT,
        responseMimeType: "application/json",
        responseSchema: CLAIM_DECOMPOSITION_JSON_SCHEMA,
      },
    });
  } catch (err: unknown) {
    const errString = String(err);
    if (
      (errString.includes("503") ||
        errString.includes("429") ||
        errString.includes("RESOURCE_EXHAUSTED") ||
        errString.includes("UNAVAILABLE") ||
        errString.includes("high demand")) &&
      activeModel !== GEMINI_MODELS.FAST
    ) {
      console.warn(
        `[ContextLock] Model ${activeModel} experiencing high demand; falling back to ${GEMINI_MODELS.FAST}.`
      );
      activeModel = GEMINI_MODELS.FAST;
      response = await client.models.generateContent({
        model: activeModel,
        contents: [promptText],
        config: {
          systemInstruction: CLAIM_DECOMPOSITION_PROMPT,
          responseMimeType: "application/json",
          responseSchema: CLAIM_DECOMPOSITION_JSON_SCHEMA,
        },
      });
    } else {
      throw err;
    }
  }

  const rawText = response.text;
  if (!rawText) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    throw new Error(
      `Failed to parse Gemini response as JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  options?.onModelUsed?.(activeModel);

  const validated = GeminiDecompositionSchema.parse(parsed);

  return validated.claims.map((c) => createEmptyAtomicClaim(c.type, c.text));
}

import { defaultEvidenceProvider } from "./evidence/providers";

/**
 * 3. retrieveEvidence()
 * Retrieves external evidence using the configured EvidenceProvider (currently GDELT for free-tier).
 */
export async function retrieveEvidence(
  targetClaim: AtomicClaim,
  contextClaims: AtomicClaim[],
  options?: { model?: string; onModelUsed?: (model: string) => void }
): Promise<import("@/types").EvidenceSource[]> {
  try {
    // 1. Try Gemini Grounded Search
    try {
      const geminiResults = await retrieveEvidenceGeminiGrounded(targetClaim, contextClaims, options);
      if (geminiResults && geminiResults.length > 0) {
        return geminiResults;
      }
    } catch (geminiErr: unknown) {
      console.warn("Gemini Grounded Search unavailable/failed:", geminiErr instanceof Error ? geminiErr.message : String(geminiErr));
      // Fall through to secondary providers
    }

    // 2. Try Fallback Evidence Providers (Google News RSS -> GDELT)
    return await defaultEvidenceProvider.search({
      claim: targetClaim,
      relatedClaims: contextClaims,
      maxResults: 5
    });
  } catch (err) {
    console.error("All evidence retrieval providers failed:", err);
    throw err;
  }
}

/**
 * Legacy/Paid Gemini Grounded Search
 * Retained for future use when quota allows.
 */
export async function retrieveEvidenceGeminiGrounded(
  targetClaim: AtomicClaim,
  contextClaims: AtomicClaim[],
  options?: { model?: string; onModelUsed?: (model: string) => void }
): Promise<import("@/types").EvidenceSource[]> {
  const client = getGeminiClient();
  const model = options?.model || GEMINI_MODELS.DEFAULT;

  // Build the search intent using the target claim and relevant context
  const contextStr = contextClaims.length > 0
    ? `\nContext: ${contextClaims.map(c => c.claimText).join(" | ")}`
    : "";

  const promptText = `Find factual reports or news related to this claim:\nClaim: "${targetClaim.claimText}"${contextStr}`;

  let response;
  let activeModel = model;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      response = await client.models.generateContent({
        model: activeModel,
        contents: [promptText],
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are an investigative evidence retrieval agent. Using Google Search, find sources that are directly relevant to the user's claim and context. Summarize the findings briefly, but prioritize providing high quality search grounding. Return the most relevant facts.",
        },
      });
      break;
    } catch (err: unknown) {
      const errString = String(err);
      const isRateLimitOrDemand =
        errString.includes("429") ||
        errString.includes("503") ||
        errString.includes("RESOURCE_EXHAUSTED") ||
        errString.includes("UNAVAILABLE") ||
        errString.includes("high demand");

      if (isRateLimitOrDemand) {
        if (activeModel !== GEMINI_MODELS.FAST) {
          console.warn(`[ContextLock] Model ${activeModel} experiencing high demand; falling back to ${GEMINI_MODELS.FAST}.`);
          activeModel = GEMINI_MODELS.FAST;
        }
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }
      throw err;
    }
  }

  if (!response || !response.candidates || response.candidates.length === 0) {
    return [];
  }

  options?.onModelUsed?.(activeModel);

  // Extract grounding metadata safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata = response.candidates[0].groundingMetadata as any;
  const sources: import("@/types").EvidenceSource[] = [];

  if (metadata && metadata.groundingChunks) {
    const urlsSeen = new Set<string>();
    let idCounter = 1;

    for (const chunk of metadata.groundingChunks) {
      if (chunk.web && chunk.web.uri) {
        const uri = chunk.web.uri;
        if (!urlsSeen.has(uri)) {
          urlsSeen.add(uri);
          
          let domain = "web";
          try {
            domain = new URL(uri).hostname;
          } catch {
            // fallback
          }
          
          sources.push({
            id: `ev-${Date.now()}-${idCounter++}`,
            title: chunk.web.title || "Web Source",
            url: uri,
            source: domain,
            snippet: "Retrieved from Google Search", 
            relationship: "context", // Neutral default, reasoning happens in Phase 6
          });
        }
      }
    }
  }

  return sources;
}

export const REASONING_JSON_SCHEMA = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["supported", "contradicted", "insufficient"] },
    explanation: { type: "string" },
    evidenceRelationships: {
      type: "array",
      items: {
        type: "object",
        properties: {
          evidenceId: { type: "string" },
          relationship: { type: "string", enum: ["supports", "contradicts", "context", "unrelated"] }
        },
        required: ["evidenceId", "relationship"]
      }
    }
  },
  required: ["status", "explanation", "evidenceRelationships"]
};

export const ReasoningResultSchema = z.object({
  status: z.enum(["supported", "contradicted", "insufficient"]),
  explanation: z.string(),
  evidenceRelationships: z.array(z.object({
    evidenceId: z.string(),
    relationship: z.enum(["supports", "contradicts", "context", "unrelated"])
  }))
});

/**
 * 4. analyzeEvidence()
 * Evaluates the relationship between an atomic claim and retrieved evidence.
 * Keeps external evidence retrieval strictly separate from Gemini reasoning.
 */
export async function analyzeEvidence(
  claim: AtomicClaim,
  evidence: import("@/types").EvidenceSource[],
  relatedClaims: AtomicClaim[] = []
): Promise<z.infer<typeof ReasoningResultSchema>> {
  if (evidence.length === 0) {
    return {
      status: "insufficient",
      explanation: "No evidence was retrieved to verify this claim.",
      evidenceRelationships: []
    };
  }

  const contextStr = relatedClaims.length > 0
    ? `\n\nContext related to the claim:\n${relatedClaims.map(c => `- ${c.type.toUpperCase()}: ${c.claimText}`).join("\n")}`
    : "";

  const evidenceStr = evidence.map((e) => `[Evidence ID: ${e.id}]\nSource: ${e.source}\nTitle: ${e.title}\nURL: ${e.url}\n${e.snippet}`).join("\n\n");

  const prompt = `You are a strict, objective fact-checking system.
Your task is to evaluate a specific claim against the provided evidence.

Target Claim (${claim.type.toUpperCase()}): "${claim.claimText}"${contextStr}

Supplied Evidence:
${evidenceStr}

Instructions:
1. Determine if the evidence supports, contradicts, or is insufficient to verify the target claim.
2. If evidence is vague, off-topic, or missing required specifics (like exact location or time), return "insufficient".
3. Evaluate EACH piece of evidence and map its ID to one of: "supports", "contradicts", "context", "unrelated".
4. Provide a concise explanation that explicitly references the evidence by ID or title.
5. Do NOT invent new evidence. Reason ONLY from the supplied evidence.
6. Do NOT return citations that are not in the supplied evidence.`;

  const { generateStructured, GEMINI_MODELS } = await import("./gemini");
  
  const result = await generateStructured({
    prompt,
    schema: ReasoningResultSchema,
    jsonSchema: REASONING_JSON_SCHEMA,
    // Use REASONING model if available, else DEFAULT
    model: GEMINI_MODELS.DEFAULT, 
  });

  // Validate and filter evidence IDs
  const validEvidenceIds = new Set(evidence.map(e => e.id));
  result.evidenceRelationships = result.evidenceRelationships.filter(rel => {
    if (!validEvidenceIds.has(rel.evidenceId)) {
      console.warn(`[ContextLock] Reasoning returned unknown evidence ID: ${rel.evidenceId}. Filtering out.`);
      return false;
    }
    return true;
  });

  return result;
}

/**
 * Test call to verify:
 * Next.js -> Gemini SDK -> Gemini API -> Structured Response
 */
export async function testGeminiConnection(
  samplePrompt?: string
): Promise<{
  success: boolean;
  model: string;
  response: MediaObservations;
  latencyMs: number;
}> {
  const startTime = Date.now();
  const testInput =
    samplePrompt ||
    "A generic photo depicting a street scene during daylight.";

  let executedModel = GEMINI_MODELS.DEFAULT;
  const observations = await analyzeMedia(
    { textPrompt: testInput },
    {
      onModelUsed: (m) => {
        executedModel = m;
      },
    }
  );
  const latencyMs = Date.now() - startTime;

  return {
    success: true,
    model: executedModel,
    response: observations,
    latencyMs,
  };
}
