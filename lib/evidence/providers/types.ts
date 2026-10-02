import { AtomicClaim, EvidenceSource } from "@/types";

export interface EvidenceSearchInput {
  claim: AtomicClaim;
  relatedClaims?: AtomicClaim[];
  maxResults?: number;
}

export interface EvidenceProvider {
  search(input: EvidenceSearchInput): Promise<EvidenceSource[]>;
}
