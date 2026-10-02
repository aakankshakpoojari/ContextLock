import { EvidenceProvider, EvidenceSearchInput } from "./types";
import { EvidenceSource } from "@/types";

export class GdeltEvidenceProvider implements EvidenceProvider {
  async search(input: EvidenceSearchInput): Promise<EvidenceSource[]> {
    const query = this.buildQuery(input);
    const timespan = this.determineTimespan(input.claim);
    const maxRecords = input.maxResults || 5;

    const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
    url.searchParams.set("query", query);
    url.searchParams.set("mode", "artlist");
    url.searchParams.set("maxrecords", maxRecords.toString());
    url.searchParams.set("timespan", timespan);
    url.searchParams.set("format", "json");

    try {
      const response = await fetch(url.toString(), {
        headers: {
          "Accept": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`GDELT API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data || !data.articles || !Array.isArray(data.articles)) {
        throw new Error("Invalid GDELT API response format: missing or invalid articles array");
      }

      const results = this.normalizeResults(data.articles).slice(0, maxRecords);
      console.log("[GDELT] Query:", query);
      console.log("[GDELT] Status:", response.status);
      console.log("[GDELT] Raw result count:", data.articles.length);
      console.log("[GDELT] Parsed evidence count:", results.length);
      return results;
    } catch (err: unknown) {
      console.error("GDELT fetch failed:", err);
      // Adding debug logs per instructions
      console.log("[GDELT] Request URL:", url.toString());
      console.log("[GDELT] Status:", err instanceof Error && err.message.includes("Too Many Requests") ? 429 : (err instanceof Error ? err.message : 'Unknown'));
      console.log("[GDELT] Raw result count: 0");
      console.log("[GDELT] Parsed evidence count: 0");
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  }

  private buildQuery(input: EvidenceSearchInput): string {
    let baseQuery = input.claim.claimText;
    
    // Simplify common prefixes
    baseQuery = baseQuery.replace(/The image shows |This video shows |The media depicts /i, "").trim();

    // Enhance query with related 'where' claim if it's a 'what' claim to improve GDELT search
    const relatedWhere = input.relatedClaims?.find(c => c.type === "where")?.claimText;
    
    if (input.claim.type === "what" && relatedWhere && !baseQuery.toLowerCase().includes(relatedWhere.toLowerCase())) {
        baseQuery += ` ${relatedWhere}`;
    }

    return baseQuery;
  }

  private determineTimespan(claim: import("@/types").AtomicClaim): string {
    if (claim.type === "when") {
      const text = claim.claimText.toLowerCase();
      if (text.includes("today") || text.includes("yesterday") || text.includes("recent") || text.includes("now")) {
        return "1day";
      }
      if (text.includes("week")) {
        return "1week";
      }
    }
    return "1month";
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeResults(articles: any[]): EvidenceSource[] {
    const results: EvidenceSource[] = [];
    const seenUrls = new Set<string>();

    for (const article of articles) {
      const url = article.url || "";
      if (!url || seenUrls.has(url)) continue;
      seenUrls.add(url);

      results.push({
        id: `gdelt-${Math.random().toString(36).substring(2, 9)}`,
        title: article.title || "Untitled Article",
        url: url,
        source: article.domain || "GDELT",
        publishedDate: article.seendate ? this.parseGdeltDate(article.seendate) : undefined,
        snippet: article.title || "No snippet available",
        relationship: "unrelated", // Will be reasoned by Gemini later
        reliabilityScore: 0.7, // Base score
      });
    }

    return results;
  }

  private parseGdeltDate(seendate: string): string {
    // GDELT seendate format: YYYYMMDDTHHMMSSZ
    if (seendate.length === 16) {
      const year = seendate.substring(0, 4);
      const month = seendate.substring(4, 6);
      const day = seendate.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return seendate;
  }
}
