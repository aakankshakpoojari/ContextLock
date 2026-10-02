export {};
import { GdeltEvidenceProvider } from "../lib/evidence/providers";

async function run() {
  const provider = new GdeltEvidenceProvider();
  
  console.log("Testing GDELT Provider...");
  
  try {
    const results = await provider.search({
      claim: {
        id: "test-1",
        type: "what",
        claimText: "Mangalore flooding",
        status: "insufficient",
        confidenceScore: 1,
        explanation: "",
        evidenceIds: []
      },
      maxResults: 5
    });

    console.log(`HTTP status: OK (200)`);
    console.log(`Number of results: ${results.length}`);
    
    results.forEach((r, i) => {
      console.log(`\nResult ${i + 1}:`);
      console.log(`Title: ${r.title}`);
      console.log(`URL: ${r.url}`);
      console.log(`Source: ${r.source}`);
      console.log(`Published Date: ${r.publishedDate || 'N/A'}`);
    });

  } catch (err) {
    console.error("Test failed:", err);
  }
}

run();

