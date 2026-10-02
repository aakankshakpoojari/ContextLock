import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { analyzeEvidence } from "../lib/gemini-service";
import { AtomicClaim, EvidenceSource } from "../types";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function runTest(testName: string, claim: AtomicClaim, evidence: EvidenceSource[]) {
  console.log(`\n============================`);
  console.log(`TEST: ${testName}`);
  console.log(`CLAIM: "${claim.claimText}"`);
  console.log(`EVIDENCE SOURCES: ${evidence.length}`);
  
  try {
    const result = await analyzeEvidence(claim, evidence);
    console.log(`-> STATUS: ${result.status}`);
    console.log(`-> EXPLANATION: ${result.explanation}`);
    console.log(`-> RELATIONSHIPS:`);
    result.evidenceRelationships.forEach((rel: { evidenceId: string; relationship: string }) => {
      console.log(`     [${rel.evidenceId}]: ${rel.relationship}`);
    });
  } catch (err) {
    console.error(`-> FAILED:`, err);
  }
}

async function main() {
  console.log("Testing Claim ↔ Evidence Reasoning...\n");

  const baseClaim: AtomicClaim = {
    id: "c1",
    type: "where",
    claimText: "The event occurred in Mangalore.",
    status: "insufficient",
    confidenceScore: 0,
    explanation: "",
    evidenceIds: []
  };

  const temporalClaim: AtomicClaim = {
    id: "c2",
    type: "when",
    claimText: "The event happened on September 30, 2026.",
    status: "insufficient",
    confidenceScore: 0,
    explanation: "",
    evidenceIds: []
  };

  // TEST 1 — SUPPORTED
  await runTest("TEST 1 — SUPPORTED", baseClaim, [
    {
      id: "ev1",
      title: "Mangalore Event",
      url: "http://example.com/1",
      source: "example.com",
      snippet: "Officials confirm the event occurred today in Mangalore.",
      relationship: "context"
    }
  ]);
  await sleep(1500);

  // TEST 2 — CONTRADICTED
  await runTest("TEST 2 — CONTRADICTED", baseClaim, [
    {
      id: "ev2",
      title: "Udupi Event",
      url: "http://example.com/2",
      source: "example.com",
      snippet: "Authorities have clarified that the event exclusively took place in Udupi, not anywhere else.",
      relationship: "context"
    }
  ]);
  await sleep(1500);

  // TEST 3 — INSUFFICIENT
  await runTest("TEST 3 — INSUFFICIENT", baseClaim, [
    {
      id: "ev3",
      title: "Karnataka Rains",
      url: "http://example.com/3",
      source: "example.com",
      snippet: "There was heavy rain in Karnataka yesterday.",
      relationship: "context"
    }
  ]);
  await sleep(1500);

  // TEST 4 — TEMPORAL SUPPORT
  await runTest("TEST 4 — TEMPORAL SUPPORT", temporalClaim, [
    {
      id: "ev4",
      title: "Event Date",
      url: "http://example.com/4",
      source: "example.com",
      snippet: "The event was successfully concluded on September 30, 2026.",
      relationship: "context"
    }
  ]);
  await sleep(1500);

  // TEST 5 — TEMPORAL CONTRADICTION
  await runTest("TEST 5 — TEMPORAL CONTRADICTION", temporalClaim, [
    {
      id: "ev5",
      title: "Event Date Change",
      url: "http://example.com/5",
      source: "example.com",
      snippet: "The highly anticipated event happened on September 20, 2026.",
      relationship: "context"
    }
  ]);
  await sleep(1500);

  // TEST 6 — NO EVIDENCE
  await runTest("TEST 6 — NO EVIDENCE", baseClaim, []);
  
  // TEST 7 — IRRELEVANT EVIDENCE
  await runTest("TEST 7 — IRRELEVANT EVIDENCE", { ...baseClaim, claimText: "The flooding occurred in Mangalore." }, [
    {
      id: "ev7",
      title: "Delhi Event",
      url: "http://example.com/7",
      source: "example.com",
      snippet: "A completely unrelated festival took place in Delhi.",
      relationship: "context"
    }
  ]);

  console.log("\nTests complete.");
}

main().catch(console.error);
