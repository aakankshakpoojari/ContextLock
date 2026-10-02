import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

/**
 * Gemini Client Initializer & Pipeline Orchestration Foundation
 * Track: Trust in a Synthetic World (Google Gemini Hack Days 2026)
 *
 * Security & Architecture Rules:
 * - Server-only: Never executed client-side.
 * - Key Safety: GEMINI_API_KEY is read strictly from process.env and never logged, exposed, or committed.
 * - Architecture: Browser -> Next.js API -> Gemini Server Layer.
 * - Gemini role: Multimodal analysis and reasoning layer, NOT the entire product.
 */

if (typeof window !== "undefined") {
  throw new Error("Gemini client must never be imported or executed in client-side code.");
}

/**
 * Centralized Gemini model configuration.
 * Using currently supported Gemini models for multimodal reasoning and structured outputs.
 */
export const GEMINI_MODELS = {
  // Primary model for multimodal visual reasoning, claim decomposition, and structured analysis
  DEFAULT: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  // Cost-efficient, high-throughput model for lightweight atomic checks and demand spike fallback
  FAST: "gemini-3.5-flash-lite",
  // Advanced reasoning model for complex cross-source conflict synthesis
  REASONING: "gemini-3.1-pro-preview",
} as const;

export const DEFAULT_GEMINI_MODEL = GEMINI_MODELS.DEFAULT;
export const PRO_GEMINI_MODEL = GEMINI_MODELS.REASONING;
export const FAST_GEMINI_MODEL = GEMINI_MODELS.FAST;

let cachedClient: GoogleGenAI | null = null;

/**
 * Retrieves the server-side Gemini SDK client instance.
 * Throws a sanitized error if the API key is not configured.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your .env.local file."
    );
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }

  return cachedClient;
}

/**
 * Convenient singleton access for server routes.
 * Uses lazy proxy to avoid instantiation until invoked during request lifecycle.
 */
export const ai = new Proxy({} as GoogleGenAI, {
  get(_target, prop) {
    const client = getGeminiClient();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export interface StructuredParams<T> {
  prompt: string;
  schema: z.ZodSchema<T>;
  jsonSchema?: Record<string, unknown>;
  model?: string;
  maxRetries?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Reusable helper to request structured JSON output from Gemini and validate it with Zod.
 * Supports exponential backoff and automatic model fallback during demand spikes.
 */
export async function generateStructured<T>({
  prompt,
  schema,
  jsonSchema,
  model = DEFAULT_GEMINI_MODEL,
  maxRetries = 3,
}: StructuredParams<T>): Promise<T> {
  const client = getGeminiClient();

  let activeModel = model;
  let responseText: string | null = null;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: activeModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          ...(jsonSchema ? { responseSchema: jsonSchema } : {}),
        },
      });

      responseText = response.text || null;
      if (responseText) {
        break; // Success
      }
    } catch (error: unknown) {
      lastError = error;
      const errString = String(error);
      const isRateLimitOrDemand =
        errString.includes("429") ||
        errString.includes("503") ||
        errString.includes("RESOURCE_EXHAUSTED") ||
        errString.includes("UNAVAILABLE") ||
        errString.includes("high demand");

      if (isRateLimitOrDemand) {
        // Fall back to FAST model if primary model experiences high demand
        if (activeModel !== GEMINI_MODELS.FAST) {
          console.warn(
            `[Gemini API] Model ${activeModel} busy; falling back to ${GEMINI_MODELS.FAST}...`
          );
          activeModel = GEMINI_MODELS.FAST;
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(
            `[Gemini API] Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`
          );
          await sleep(delay);
          continue;
        }
      }

      console.error("Gemini API call failed:", error);
      throw new Error(`Gemini API failure: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  if (!responseText) {
    throw new Error(
      `Gemini API failed after ${maxRetries} attempts. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(responseText);
  } catch {
    console.error("Gemini output is not valid JSON:", responseText);
    throw new Error("Failed to parse Gemini output as JSON.");
  }

  const validationResult = schema.safeParse(parsedJson);
  if (!validationResult.success) {
    console.error("Zod validation failed against Gemini output:", validationResult.error);
    throw new Error(`Schema validation failed: ${validationResult.error.message}`);
  }

  return validationResult.data;
}
