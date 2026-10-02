import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { decomposeClaims } from "../lib/gemini-service";

async function runTests() {
  console.log("Testing Claim Decomposition...\n");

  const testCases = [
    {
      name: "Test 1 — Full contextual claim",
      input: "This video shows today's massive flooding in Mangalore.",
      expectedCount: 3, // what, where, when
    },
    {
      name: "Test 2 — Location + time",
      input: "This happened in Mangalore yesterday.",
      expectedCount: 2, // where, when
    },
    {
      name: "Test 3 — Person claim",
      input: "This video shows Rahul speaking at the event in Bangalore yesterday.",
      expectedCount: 4, // who, what, where, when
    },
    {
      name: "Test 4 — No factual claim",
      input: "Wow, look at this!",
      expectedCount: 0,
    },
    {
      name: "Test 5 — Ambiguous language",
      input: "Looks like flooding in Mangalore.",
      expectedCount: 2,
    },
    {
      name: "Test 6 — No hallucinated facts",
      input: "This video shows flooding in Mangalore.",
      expectedCount: 2, // what, where
    },
  ];

  for (const test of testCases) {
    console.log(`\n============================`);
    console.log(`${test.name}`);
    console.log(`Input: "${test.input}"`);
    console.log(`============================`);
    
    try {
      const claims = await decomposeClaims(test.input);
      console.log(`Extracted ${claims.length} claim(s):`);
      claims.forEach((c) => {
        console.log(`  [${c.type.toUpperCase()}] ${c.claimText}`);
      });
      if (test.expectedCount !== claims.length) {
        console.warn(`⚠️ Expected ~${test.expectedCount} claims, got ${claims.length}`);
      }
      
      // Wait 3 seconds to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (err) {
      console.error("Error decomposing claim:", err);
    }
  }

  console.log("\nTests complete.");
}

runTests();
