import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { retrieveEvidence } from "../lib/gemini-service";
import { AtomicClaim } from "../types";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log("Testing Evidence Retrieval...\n");

  const claim1: AtomicClaim = {
    id: "claim-1",
    type: "what",
    claimText: "Massive flooding is occurring.",
    status: "insufficient",
    confidenceScore: 0,
    explanation: "",
    evidenceIds: []
  };
  
  const claim2: AtomicClaim = {
    id: "claim-2",
    type: "where",
    claimText: "Mangalore.",
    status: "insufficient",
    confidenceScore: 0,
    explanation: "",
    evidenceIds: []
  };

  const claim3: AtomicClaim = {
    id: "claim-3",
    type: "when",
    claimText: "today.",
    status: "insufficient",
    confidenceScore: 0,
    explanation: "",
    evidenceIds: []
  };

  console.log("============================");
  console.log("Test 1 — Basic evidence retrieval");
  console.log("============================");
  try {
    const evidence = await retrieveEvidence(claim1, [claim2, claim3]);
    console.log(`Extracted ${evidence.length} evidence source(s).`);
    evidence.forEach((e, i) => {
      console.log(`  [${i+1}] ${e.source}: ${e.title}`);
      console.log(`      URL: ${e.url}`);
    });
  } catch (err) {
    console.error("Test 1 Failed:", err);
  }

  await sleep(3000);

  console.log("\n============================");
  console.log("Test 2 — Location claim");
  console.log("============================");
  try {
    const evidence = await retrieveEvidence(claim2, []);
    console.log(`Extracted ${evidence.length} evidence source(s).`);
    evidence.forEach((e, i) => {
      console.log(`  [${i+1}] ${e.source}: ${e.title}`);
      console.log(`      URL: ${e.url}`);
    });
  } catch (err) {
    console.error("Test 2 Failed:", err);
  }

  await sleep(3000);

  console.log("\n============================");
  console.log("Test 3 — Unsupported/vague claim");
  console.log("============================");
  const vagueClaim: AtomicClaim = {
    id: "claim-vague",
    type: "other",
    claimText: "There are green aliens invading a coffee shop.",
    status: "insufficient",
    confidenceScore: 0,
    explanation: "",
    evidenceIds: []
  };
  try {
    const evidence = await retrieveEvidence(vagueClaim, []);
    console.log(`Extracted ${evidence.length} evidence source(s).`);
  } catch (err) {
    console.error("Test 3 Failed:", err);
  }

  console.log("\nTests complete.");
}

run().catch(console.error);
