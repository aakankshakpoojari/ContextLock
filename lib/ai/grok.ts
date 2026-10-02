if (typeof window !== "undefined") {
  throw new Error("Grok AI provider must never be executed in client-side code.");
}

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
  SYNTHETIC_ANALYSIS_SYSTEM_PROMPT,
  ReasoningResultSchema,
} from "../gemini-service";

export const GROK_MODELS = {
  // Primary multimodal vision model
  VISION: process.env.GROK_VISION_MODEL || "grok-2-vision-1212",
  // Primary reasoning and structured text model
  DEFAULT: process.env.GROK_MODEL || "grok-2-latest",
  // Fallback fast text model
  FAST: "grok-beta",
} as const;

interface GrokChatMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } }
      >;
}

interface GrokChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const GrokDecompositionSchema = z.object({
  claims: z.array(
    z.object({
      type: z.enum(["what", "where", "when", "who", "other"]),
      text: z.string(),
    })
  ),
});

export class GrokAIProvider implements AIProvider {
  readonly name = "grok" as const;

  isAvailable(): boolean {
    const key = process.env.GROK_API_KEY;
    return typeof key === "string" && key.trim().length > 0;
  }

  private getApiKey(): string {
    const key = process.env.GROK_API_KEY;
    if (!key || key.trim() === "") {
      throw new Error(
        "GROK_API_KEY is not configured. Please set GROK_API_KEY in your .env.local file."
      );
    }
    return key.trim();
  }

  private async callGrokApi(
    messages: GrokChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
      jsonMode?: boolean;
    }
  ): Promise<{ content: string; model: string }> {
    const apiKey = this.getApiKey();
    const model = options?.model || GROK_MODELS.DEFAULT;

    const requestBody = {
      model,
      messages,
      temperature: options?.temperature ?? 0.1,
      ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
    };

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorDetails = "";
      try {
        const errorJson = await response.json();
        errorDetails = JSON.stringify(errorJson);
      } catch {
        errorDetails = await response.text();
      }

      throw new Error(
        `xAI Grok API error (HTTP ${response.status}): ${errorDetails || response.statusText}`
      );
    }

    const data: GrokChatCompletionResponse = await response.json();

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      throw new Error("Grok API returned an empty completion response.");
    }

    return {
      content: data.choices[0].message.content,
      model: data.model || model,
    };
  }

  async analyzeMedia(
    input: MediaObservationInput,
    options?: { model?: string }
  ): Promise<{ data: MediaObservations; model: string }> {
    const hasVisualParts = input.mediaParts && input.mediaParts.some((p) => p.inlineData);
    const selectedModel = options?.model || (hasVisualParts ? GROK_MODELS.VISION : GROK_MODELS.DEFAULT);

    const userContent: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [];

    if (input.mediaParts && input.mediaParts.length > 0) {
      for (const part of input.mediaParts) {
        if (part.inlineData) {
          const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          userContent.push({
            type: "image_url",
            image_url: { url: dataUrl },
          });
        }
      }
    }

    const promptText =
      input.textPrompt && input.textPrompt.trim() !== ""
        ? input.textPrompt
        : "Analyze the provided media and extract objective, verifiable observations without forming conclusions. Respond ONLY in valid JSON matching the schema.";

    userContent.push({
      type: "text",
      text: `${promptText}\n\nYou MUST return a JSON object strictly matching this schema:
{
  "observations": string[],
  "visibleText": string[],
  "locationClues": string[],
  "timeClues": string[],
  "notableDetails": string[]
}`,
    });

    const messages: GrokChatMessage[] = [
      {
        role: "system",
        content: MEDIA_OBSERVATION_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userContent,
      },
    ];

    const result = await this.callGrokApi(messages, {
      model: selectedModel,
      jsonMode: true,
      temperature: 0.1,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(result.content);
    } catch (err) {
      throw new Error(
        `Failed to parse Grok media observation response as JSON: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const data = MediaObservationsSchema.parse(parsed);
    return { data, model: result.model };
  }

  async analyzeSyntheticMedia(
    input: MediaObservationInput,
    options?: { model?: string }
  ): Promise<{ data: SyntheticMediaAnalysis; model: string }> {
    const hasVisualParts = input.mediaParts && input.mediaParts.some((p) => p.inlineData);
    const selectedModel = options?.model || (hasVisualParts ? GROK_MODELS.VISION : GROK_MODELS.DEFAULT);

    const userContent: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } }
    > = [];

    if (input.mediaParts && input.mediaParts.length > 0) {
      for (const part of input.mediaParts) {
        if (part.inlineData) {
          const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          userContent.push({
            type: "image_url",
            image_url: { url: dataUrl, detail: "high" },
          });
        }
      }
    }

    const promptText =
      input.textPrompt && input.textPrompt.trim() !== ""
        ? input.textPrompt
        : "Forensically inspect the media for observable visual/auditory indicators characteristic of generative AI synthesis, deepfakes, face swapping, or digital manipulation.";

    userContent.push({
      type: "text",
      text: `${promptText}\n\nYou MUST return a JSON object strictly matching this schema:
{
  "status": "synthetic_indicators" | "no_strong_indicators" | "inconclusive",
  "confidence": "low" | "medium" | "high",
  "indicators": [
    {
      "category": "visual_artifact" | "facial_consistency" | "lighting" | "geometry" | "text" | "reflection" | "temporal_consistency" | "audio_visual" | "other",
      "observation": string,
      "severity": "low" | "medium" | "high"
    }
  ],
  "explanation": string
}`,
    });

    const messages: GrokChatMessage[] = [
      {
        role: "system",
        content: SYNTHETIC_ANALYSIS_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userContent,
      },
    ];

    const result = await this.callGrokApi(messages, {
      model: selectedModel,
      jsonMode: true,
      temperature: 0.1,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(result.content);
    } catch (err) {
      throw new Error(
        `Failed to parse Grok synthetic media analysis response as JSON: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const validated = SyntheticMediaAnalysisSchema.parse(parsed);
    return { data: validated, model: result.model };
  }

  async decomposeClaims(
    claimText: string,
    options?: { model?: string }
  ): Promise<{ data: AtomicClaim[]; model: string }> {
    const selectedModel = options?.model || GROK_MODELS.DEFAULT;

    const messages: GrokChatMessage[] = [
      {
        role: "system",
        content: `${CLAIM_DECOMPOSITION_PROMPT}\n\nYou MUST return a JSON object with this exact structure:
{
  "claims": [
    {
      "type": "what" | "where" | "when" | "who" | "other",
      "text": string
    }
  ]
}`,
      },
      {
        role: "user",
        content: `Decompose the following user claim into independently verifiable atomic claims. Do not invent new facts. Split compound claims if needed. If no factual claim is made, return an empty claims array.\n\nUSER CLAIM: "${claimText}"`,
      },
    ];

    const result = await this.callGrokApi(messages, {
      model: selectedModel,
      jsonMode: true,
      temperature: 0.1,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(result.content);
    } catch (err) {
      throw new Error(
        `Failed to parse Grok claim decomposition response as JSON: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const validated = GrokDecompositionSchema.parse(parsed);
    const data = validated.claims.map((c) => createEmptyAtomicClaim(c.type, c.text));

    return { data, model: result.model };
  }

  async analyzeEvidence(
    claim: AtomicClaim,
    evidence: EvidenceSource[],
    relatedClaims: AtomicClaim[] = [],
    options?: { model?: string }
  ): Promise<{ data: ReasoningResult; model: string }> {
    const selectedModel = options?.model || GROK_MODELS.DEFAULT;

    if (evidence.length === 0) {
      return {
        data: {
          status: "insufficient",
          explanation: "No evidence was retrieved to verify this claim.",
          evidenceRelationships: [],
        },
        model: selectedModel,
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

    const systemPrompt = `You are a strict, objective fact-checking system.
Your task is to evaluate a specific claim against the provided evidence.

Instructions:
1. Determine if the evidence supports, contradicts, or is insufficient to verify the target claim.
2. If evidence is vague, off-topic, or missing required specifics (like exact location or time), return "insufficient".
3. Evaluate EACH piece of evidence and map its ID to one of: "supports", "contradicts", "context", "unrelated".
4. Provide a concise explanation that explicitly references the evidence by ID or title.
5. Do NOT invent new evidence. Reason ONLY from the supplied evidence.
6. Return a valid JSON object strictly matching this schema:
{
  "status": "supported" | "contradicted" | "insufficient",
  "explanation": string,
  "evidenceRelationships": [
    {
      "evidenceId": string,
      "relationship": "supports" | "contradicts" | "context" | "unrelated"
    }
  ]
}`;

    const userPrompt = `Target Claim (${claim.type.toUpperCase()}): "${claim.claimText}"${contextStr}

Supplied Evidence:
${evidenceStr}`;

    const messages: GrokChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const result = await this.callGrokApi(messages, {
      model: selectedModel,
      jsonMode: true,
      temperature: 0.1,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(result.content);
    } catch (err) {
      throw new Error(
        `Failed to parse Grok evidence reasoning response as JSON: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const validated = ReasoningResultSchema.parse(parsed);
    const validEvidenceIds = new Set(evidence.map((e) => e.id));
    validated.evidenceRelationships = validated.evidenceRelationships.filter(
      (rel: { evidenceId: string }) => validEvidenceIds.has(rel.evidenceId)
    );

    return { data: validated, model: result.model };
  }

  async generateStructured<T>({
    prompt,
    systemInstruction,
    schema,
    model = GROK_MODELS.DEFAULT,
  }: StructuredGenerationOptions<T>): Promise<{ data: T; model: string }> {
    const messages: GrokChatMessage[] = [
      {
        role: "system",
        content: `${systemInstruction || "You are a structured analytical assistant."}\nYou must respond strictly with valid JSON.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    const result = await this.callGrokApi(messages, {
      model,
      jsonMode: true,
      temperature: 0.1,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(result.content);
    } catch (err) {
      throw new Error(
        `Failed to parse Grok output as JSON: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const data = schema.parse(parsed);
    return { data, model: result.model };
  }
}

export const grokProvider = new GrokAIProvider();
