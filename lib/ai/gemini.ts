if (typeof window !== "undefined") {
  throw new Error("Gemini AI provider must never be executed in client-side code.");
}

import { getGeminiClient, GEMINI_MODELS } from "../gemini";
import {
  MediaObservations,
  MediaObservationsSchema,
  MediaObservationInput,
  AtomicClaim,
  EvidenceSource,
  SyntheticMediaAnalysis,
  SyntheticMediaAnalysisSchema,
} from "@/types";
import {
  AIProvider,
  ReasoningResult,
  StructuredGenerationOptions,
} from "./types";
import { z } from "zod";
import { CLAIM_DECOMPOSITION_PROMPT, createEmptyAtomicClaim } from "../claims";
import {
  MEDIA_OBSERVATION_SYSTEM_PROMPT,
  MEDIA_OBSERVATIONS_JSON_SCHEMA,
  SYNTHETIC_ANALYSIS_SYSTEM_PROMPT,
  SYNTHETIC_ANALYSIS_JSON_SCHEMA,
  CLAIM_DECOMPOSITION_JSON_SCHEMA,
  REASONING_JSON_SCHEMA,
  ReasoningResultSchema,
} from "../gemini-service";

const GeminiDecompositionSchema = z.object({
  claims: z.array(
    z.object({
      type: z.enum(["what", "where", "when", "who", "other"]),
      text: z.string(),
    })
  ),
});

export class GeminiAIProvider implements AIProvider {
  readonly name = "gemini" as const;

  isAvailable(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return typeof key === "string" && key.trim().length > 0;
  }

  async analyzeMedia(
    input: MediaObservationInput,
    options?: { model?: string }
  ): Promise<{ data: MediaObservations; model: string }> {
    const client = getGeminiClient();
    const model = options?.model || GEMINI_MODELS.DEFAULT;

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

    let activeModel = model;
    let response;

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
      if (
        (errString.includes("503") ||
          errString.includes("UNAVAILABLE") ||
          errString.includes("high demand")) &&
        activeModel !== GEMINI_MODELS.FAST
      ) {
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

    const parsed = JSON.parse(rawText);
    const data = MediaObservationsSchema.parse(parsed);

    return { data, model: activeModel };
  }

  async analyzeSyntheticMedia(
    input: MediaObservationInput,
    options?: { model?: string }
  ): Promise<{ data: SyntheticMediaAnalysis; model: string }> {
    const client = getGeminiClient();
    const model = options?.model || GEMINI_MODELS.DEFAULT;

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
        : "Forensically inspect the media for observable visual/auditory indicators characteristic of generative AI synthesis, deepfakes, face swapping, or digital manipulation. Record factual observations.";

    contents.push(promptText);

    let activeModel = model;
    let response;

    try {
      response = await client.models.generateContent({
        model: activeModel,
        contents,
        config: {
          systemInstruction: SYNTHETIC_ANALYSIS_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: SYNTHETIC_ANALYSIS_JSON_SCHEMA,
        },
      });
    } catch (err: unknown) {
      const errString = String(err);
      if (
        (errString.includes("503") ||
          errString.includes("UNAVAILABLE") ||
          errString.includes("high demand")) &&
        activeModel !== GEMINI_MODELS.FAST
      ) {
        activeModel = GEMINI_MODELS.FAST;
        response = await client.models.generateContent({
          model: activeModel,
          contents,
          config: {
            systemInstruction: SYNTHETIC_ANALYSIS_SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseSchema: SYNTHETIC_ANALYSIS_JSON_SCHEMA,
          },
        });
      } else {
        throw err;
      }
    }

    const rawText = response.text;
    if (!rawText) {
      throw new Error("Gemini returned an empty response for synthetic analysis.");
    }

    const parsed = JSON.parse(rawText);
    const data = SyntheticMediaAnalysisSchema.parse(parsed);

    return { data, model: activeModel };
  }

  async decomposeClaims(
    claimText: string,
    options?: { model?: string }
  ): Promise<{ data: AtomicClaim[]; model: string }> {
    const client = getGeminiClient();
    const model = options?.model || GEMINI_MODELS.DEFAULT;

    const promptText = `Decompose the following user claim into independently verifiable atomic claims. Do not invent new facts. Split compound claims if needed. If no factual claim is made, return an empty array.\n\nUSER CLAIM: "${claimText}"`;

    let activeModel = model;
    let response;

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

    const parsed = JSON.parse(rawText);
    const validated = GeminiDecompositionSchema.parse(parsed);
    const data = validated.claims.map((c) => createEmptyAtomicClaim(c.type, c.text));

    return { data, model: activeModel };
  }

  async analyzeEvidence(
    claim: AtomicClaim,
    evidence: EvidenceSource[],
    relatedClaims: AtomicClaim[] = [],
    options?: { model?: string }
  ): Promise<{ data: ReasoningResult; model: string }> {
    if (evidence.length === 0) {
      return {
        data: {
          status: "insufficient",
          explanation: "No evidence was retrieved to verify this claim.",
          evidenceRelationships: [],
        },
        model: options?.model || GEMINI_MODELS.DEFAULT,
      };
    }

    const contextStr =
      relatedClaims.length > 0
        ? `\n\nContext related to the claim:\n${relatedClaims.map((c) => `- ${c.type.toUpperCase()}: ${c.claimText}`).join("\n")}`
        : "";

    const evidenceStr = evidence
      .map(
        (e) =>
          `[Evidence ID: ${e.id}]\nSource: ${e.source}\nTitle: ${e.title}\nURL: ${e.url}\n${e.snippet}`
      )
      .join("\n\n");

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

    const { generateStructured } = await import("../gemini");
    const activeModel = options?.model || GEMINI_MODELS.DEFAULT;

    const result = await generateStructured<ReasoningResult>({
      prompt,
      schema: ReasoningResultSchema,
      jsonSchema: REASONING_JSON_SCHEMA,
      model: activeModel,
    });

    const validEvidenceIds = new Set(evidence.map((e) => e.id));
    result.evidenceRelationships = result.evidenceRelationships.filter(
      (rel: { evidenceId: string }) => {
        return validEvidenceIds.has(rel.evidenceId);
      }
    );

    return { data: result, model: activeModel };
  }

  async generateStructured<T>({
    prompt,
    systemInstruction,
    schema,
    jsonSchema,
    model = GEMINI_MODELS.DEFAULT,
  }: StructuredGenerationOptions<T>): Promise<{ data: T; model: string }> {
    const client = getGeminiClient();
    let activeModel = model;

    const contents = prompt;
    let response;

    try {
      response = await client.models.generateContent({
        model: activeModel,
        contents,
        config: {
          ...(systemInstruction ? { systemInstruction } : {}),
          responseMimeType: "application/json",
          ...(jsonSchema ? { responseSchema: jsonSchema } : {}),
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
        activeModel = GEMINI_MODELS.FAST;
        response = await client.models.generateContent({
          model: activeModel,
          contents,
          config: {
            ...(systemInstruction ? { systemInstruction } : {}),
            responseMimeType: "application/json",
            ...(jsonSchema ? { responseSchema: jsonSchema } : {}),
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

    const parsed = JSON.parse(rawText);
    const data = schema.parse(parsed);

    return { data, model: activeModel };
  }
}

export const geminiProvider = new GeminiAIProvider();
