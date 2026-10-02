import { EvidenceProvider, EvidenceSearchInput } from "./types";
import { EvidenceSource } from "@/types";
import { retrieveEvidenceGeminiGrounded } from "../../gemini-service";

export class GeminiSearchEvidenceProvider implements EvidenceProvider {
  async search(input: EvidenceSearchInput): Promise<EvidenceSource[]> {
    return await retrieveEvidenceGeminiGrounded(input.claim, input.relatedClaims || []);
  }
}
