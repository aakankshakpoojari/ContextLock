import { GdeltEvidenceProvider } from "./gdelt";
import { GoogleNewsRssEvidenceProvider } from "./google-news";
import { EvidenceProvider, EvidenceSearchInput } from "./types";
import { EvidenceSource } from "@/types";

export class FallbackEvidenceProvider implements EvidenceProvider {
  private providers: EvidenceProvider[];

  constructor(providers: EvidenceProvider[]) {
    this.providers = providers;
  }

  async search(input: EvidenceSearchInput): Promise<EvidenceSource[]> {
    let lastError: Error | null = null;
    for (const provider of this.providers) {
      try {
        const results = await provider.search(input);
        return results;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`Provider ${provider.constructor.name} failed:`, lastError.message);
        // Continue to the next provider
      }
    }
    
    // If all providers failed, rethrow the last error to indicate PROVIDER_UNAVAILABLE
    if (lastError) {
       throw new Error(`All evidence providers failed. Last error: ${lastError.message}`);
    }

    return [];
  }
}

export const defaultEvidenceProvider = new FallbackEvidenceProvider([
  new GoogleNewsRssEvidenceProvider(), // Active default MVP (since Gemini is rate-limited and GDELT is unreachable)
  new GdeltEvidenceProvider()
]);

export { GdeltEvidenceProvider } from "./gdelt";
export { GoogleNewsRssEvidenceProvider } from "./google-news";
export * from "./types";
