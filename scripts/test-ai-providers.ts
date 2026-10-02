import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function runTests() {
  console.log("=== ContextLock AI Provider & Fallback Test Suite ===");
  console.log("Gemini API Key configured:", Boolean(process.env.GEMINI_API_KEY));
  console.log("Grok API Key configured:", Boolean(process.env.GROK_API_KEY));
  console.log("AI_PROVIDER override:", process.env.AI_PROVIDER || "auto");

  const { getAIProviderStatus, analyzeMedia, decomposeClaims } = await import("../lib/ai");

  console.log("\n[Status]", getAIProviderStatus());

  // Test 1: Decompose claims using AI Orchestrator (Auto: Gemini primary, Grok fallback)
  console.log("\n--- Test 1: Claim Decomposition (AI Orchestrator) ---");
  try {
    const result = await decomposeClaims(
      "This video shows today's severe flooding in Mangalore."
    );
    console.log(`✅ Success via [${result.provider.toUpperCase()} // model: ${result.model}] (${result.latencyMs}ms):`);
    console.log(JSON.stringify(result.data, null, 2));
  } catch (err) {
    console.error("❌ Orchestrator decomposition failed:", err);
  }

  // Test 2: Multimodal / Text Media Observation
  console.log("\n--- Test 2: Media Observation (AI Orchestrator) ---");
  try {
    const obs = await analyzeMedia({
      textPrompt: "A photograph showing submerged vehicles near Kottara Chowki with Kannada signboards under heavy monsoon rainfall.",
    });
    console.log(`✅ Success via [${obs.provider.toUpperCase()} // model: ${obs.model}] (${obs.latencyMs}ms):`);
    console.log("Observations:", obs.data.observations);
    console.log("Location Clues:", obs.data.locationClues);
    console.log("Time Clues:", obs.data.timeClues);
  } catch (err) {
    console.error("❌ Orchestrator analyzeMedia failed:", err);
  }

  // Test 3: Test Direct Grok Provider
  console.log("\n--- Test 3: Direct Grok Provider Invocation ---");
  try {
    const { grokProvider } = await import("../lib/ai/grok");
    if (!grokProvider.isAvailable()) {
      console.log("⚠️ Grok provider not available (GROK_API_KEY not set).");
    } else {
      const grokResult = await grokProvider.decomposeClaims(
        "A photo claiming fresh snowfall in Shimla this morning."
      );
      console.log(`✅ Grok direct success [model: ${grokResult.model}]:`, grokResult.data);
    }
  } catch (err) {
    console.error("❌ Grok direct call failed:", err);
  }
}

runTests().catch(console.error);
