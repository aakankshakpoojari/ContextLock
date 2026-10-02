import dotenv from "dotenv";
import path from "path";

// Load environment variables FIRST before importing anything that uses them
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { z } from "zod";
import { generateStructured } from "../lib/gemini";

const TestGeminiSchema = z.object({
  topic: z.string(),
  funFacts: z.array(z.string()).min(2).max(3),
  complexity: z.number().describe("Complexity of the topic from 1 to 10"),
});

const testJsonSchema = {
  type: "object",
  properties: {
    topic: { type: "string" },
    funFacts: { 
      type: "array",
      items: { type: "string" }
    },
    complexity: { 
      type: "integer", 
      description: "Complexity of the topic from 1 to 10" 
    }
  },
  required: ["topic", "funFacts", "complexity"]
};

async function runTest() {
  console.log("Testing Gemini Structured Output Pipeline...");
  
  try {
    const result = await generateStructured({
      prompt: "Give me 2 to 3 fun facts about the planet Mars.",
      schema: TestGeminiSchema,
      jsonSchema: testJsonSchema,
    });
    
    console.log("Success! Received structured response:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

runTest();
