export {};
import { GdeltEvidenceProvider } from "../lib/evidence/providers/gdelt";

async function run() {
  const provider = new GdeltEvidenceProvider();
  
  const claims = [
    { text: "A protest is blocking traffic in downtown Seattle today." },
    { text: "Apple launched a new iPhone event in California." },
    { text: "major earthquake news" }
  ];

  for (const c of claims) {
    console.log(`\nTesting claim: "${c.text}"`);
    try {
      const results = await provider.search({
        claim: {
          id: "test",
          type: "what",
          claimText: c.text,
          status: "insufficient",
          confidenceScore: 1,
          explanation: "",
          evidenceIds: []
        },
        maxResults: 3
      });

      console.log(`Number of results: ${results.length}`);
      
      results.forEach((r, i) => {
        console.log(`\nResult ${i + 1}:`);
        console.log(`Title: ${r.title}`);
        console.log(`URL: ${r.url}`);
      });
    } catch (err) {
      console.error("Test failed:", err);
    }
    // sleep for 6 seconds to respect GDELT rate limit
    await new Promise(r => setTimeout(r, 6000));
  }
}

run();
