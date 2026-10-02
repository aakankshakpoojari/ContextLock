import { EvidenceProvider, EvidenceSearchInput } from "./types";
import { EvidenceSource } from "@/types";
import { XMLParser } from "fast-xml-parser";

export class GoogleNewsRssEvidenceProvider implements EvidenceProvider {
  async search(input: EvidenceSearchInput): Promise<EvidenceSource[]> {
    const query = this.buildQuery(input);
    const maxRecords = input.maxResults || 5;

    const url = new URL("https://news.google.com/rss/search");
    url.searchParams.set("q", query);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          "Accept": "application/rss+xml, application/xml, text/xml"
        }
      });
      if (!response.ok) {
        throw new Error(`Google News RSS error: ${response.statusText}`);
      }

      const text = await response.text();
      const parser = new XMLParser({
        ignoreAttributes: false,
        parseTagValue: true,
      });
      const data = parser.parse(text);

      let items = data?.rss?.channel?.item;
      if (!items) {
        return [];
      }
      
      if (!Array.isArray(items)) {
        items = [items];
      }

      const results = this.normalizeResults(items).slice(0, maxRecords);
      return results;
    } catch (err: unknown) {
      console.error("Google News RSS fetch failed:", err);
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  }

  private buildQuery(input: EvidenceSearchInput): string {
    let baseQuery = input.claim.claimText;
    
    // Simplify common prefixes
    baseQuery = baseQuery.replace(/The image shows |This video shows |The media depicts /i, "").trim();

    // Add related where/when context if missing
    const relatedWhere = input.relatedClaims?.find(c => c.type === "where")?.claimText;
    if (input.claim.type !== "where" && relatedWhere && !baseQuery.toLowerCase().includes(relatedWhere.toLowerCase())) {
        baseQuery += ` ${relatedWhere}`;
    }

    const relatedWhen = input.relatedClaims?.find(c => c.type === "when")?.claimText;
    if (input.claim.type !== "when" && relatedWhen && !baseQuery.toLowerCase().includes(relatedWhen.toLowerCase())) {
        // Only append date if it's meaningful, e.g., today/yesterday gets resolved to current context.
        // Actually, just passing the text from the claim is best.
        baseQuery += ` ${relatedWhen}`;
    }

    return baseQuery;
  }

  private stripHtml(html: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeResults(items: any[]): EvidenceSource[] {
    const results: EvidenceSource[] = [];
    const seenUrls = new Set<string>();

    for (const item of items) {
      const url = item.link || "";
      if (!url || seenUrls.has(url)) continue;
      seenUrls.add(url);

      const title = item.title ? this.stripHtml(String(item.title)).trim() : "Untitled Article";
      const snippet = item.description ? this.stripHtml(String(item.description)).trim() : title;
      const sourceName = item.source ? (typeof item.source === 'string' ? item.source : item.source['#text']) : "Google News";

      results.push({
        id: `gn-${Math.random().toString(36).substring(2, 9)}`,
        title,
        url,
        source: sourceName || "Google News",
        publishedDate: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
        snippet,
        relationship: "unrelated", // Will be reasoned by Gemini later
        reliabilityScore: 0.8, // Base score
      });
    }

    return results;
  }
}
