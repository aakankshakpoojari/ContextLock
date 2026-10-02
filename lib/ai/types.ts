import { z } from "zod";
import {
  MediaObservations,
  MediaObservationInput,
  AtomicClaim,
  EvidenceSource,
  SyntheticMediaAnalysis,
} from "@/types";

if (typeof window !== "undefined") {
  throw new Error("AI provider types must never be executed in client-side code.");
}


export type AIProviderType = "gemini" | "grok";

export interface AIProviderResponse<T> {
  data: T;
  provider: AIProviderType;
  model: string;
  latencyMs: number;
}

export interface ReasoningRelationship {
  evidenceId: string;
  relationship: "supports" | "contradicts" | "context" | "unrelated";
}

export interface ReasoningResult {
  status: "supported" | "contradicted" | "insufficient";
  explanation: string;
  evidenceRelationships: ReasoningRelationship[];
}

export interface StructuredGenerationOptions<T> {
  prompt: string;
  systemInstruction?: string;
  schema: z.ZodSchema<T>;
  jsonSchema?: Record<string, unknown>;
  model?: string;
  maxRetries?: number;
}

export interface AIProvider {
  readonly name: AIProviderType;
  isAvailable(): boolean;
  analyzeMedia(
    input: MediaObservationInput,
    options?: { model?: string }
  ): Promise<{ data: MediaObservations; model: string }>;
  analyzeSyntheticMedia(
    input: MediaObservationInput,
    options?: { model?: string }
  ): Promise<{ data: SyntheticMediaAnalysis; model: string }>;
  decomposeClaims(
    claimText: string,
    options?: { model?: string }
  ): Promise<{ data: AtomicClaim[]; model: string }>;
  analyzeEvidence(
    claim: AtomicClaim,
    evidence: EvidenceSource[],
    relatedClaims?: AtomicClaim[],
    options?: { model?: string }
  ): Promise<{ data: ReasoningResult; model: string }>;
  generateStructured<T>(
    params: StructuredGenerationOptions<T>
  ): Promise<{ data: T; model: string }>;
}
