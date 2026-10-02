import { NextRequest, NextResponse } from "next/server";
import { testGeminiConnection } from "@/lib/gemini-service";
import { getAIProviderStatus } from "@/lib/ai";

/**
 * AI Provider Verification & Diagnostic Test Endpoint
 * GET /api/gemini/test
 * POST /api/gemini/test
 *
 * Verifies the full pipeline:
 * Next.js -> AI Orchestrator -> Primary (Gemini) / Fallback (Grok) -> Structured Response
 *
 * Security & Reliability:
 * - Safely handles missing API keys, API errors, rate limits, and fallback transitions.
 * - Never logs or exposes API keys or secrets in responses.
 */

function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
      .replace(/key=[a-zA-Z0-9_-]+/gi, "key=[REDACTED]")
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED]");
  }
  return "An unexpected error occurred during AI API execution.";
}

function handleAIError(error: unknown) {
  const message = sanitizeErrorMessage(error);
  const errorString = String(error);

  if (
    message.includes("is not configured") &&
    !process.env.GEMINI_API_KEY &&
    !process.env.GROK_API_KEY
  ) {
    return NextResponse.json(
      {
        status: "error",
        error: "CONFIGURATION_ERROR",
        message:
          "Neither GEMINI_API_KEY nor GROK_API_KEY is configured in your .env.local file.",
        providers: getAIProviderStatus(),
      },
      { status: 503 }
    );
  }

  if (
    errorString.includes("429") ||
    errorString.includes("RESOURCE_EXHAUSTED") ||
    message.toLowerCase().includes("rate limit")
  ) {
    return NextResponse.json(
      {
        status: "error",
        error: "RATE_LIMIT_EXCEEDED",
        message: "AI provider rate limit exceeded across all available engines.",
        details: message,
        providers: getAIProviderStatus(),
      },
      { status: 429 }
    );
  }

  return NextResponse.json(
    {
      status: "error",
      error: "AI_ORCHESTRATOR_ERROR",
      message: "AI analysis failed across provider pipeline.",
      details: message,
      providers: getAIProviderStatus(),
    },
    { status: 502 }
  );
}

export async function GET() {
  try {
    const result = await testGeminiConnection();
    const providerStatus = getAIProviderStatus();

    return NextResponse.json(
      {
        status: "success",
        pipeline:
          "Next.js API Route -> AI Orchestrator (Primary: Gemini / Fallback: Grok) -> Structured JSON Response",
        model: result.model,
        latencyMs: result.latencyMs,
        providerStatus,
        data: result.response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ContextLock API Error] /api/gemini/test failed:", sanitizeErrorMessage(error));
    return handleAIError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    let customPrompt: string | undefined;

    try {
      const body = await req.json();
      if (typeof body?.prompt === "string" && body.prompt.trim()) {
        customPrompt = body.prompt.trim();
      } else if (
        typeof body?.mediaDescription === "string" &&
        body.mediaDescription.trim()
      ) {
        customPrompt = body.mediaDescription.trim();
      }
    } catch {
      // Empty or invalid body defaults to sample prompt
    }

    const result = await testGeminiConnection(customPrompt);
    const providerStatus = getAIProviderStatus();

    return NextResponse.json(
      {
        status: "success",
        pipeline:
          "Next.js API Route -> AI Orchestrator (Primary: Gemini / Fallback: Grok) -> Structured JSON Response",
        model: result.model,
        latencyMs: result.latencyMs,
        providerStatus,
        inputPrompt: customPrompt || "Default test prompt",
        data: result.response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ContextLock API Error] /api/gemini/test POST failed:", sanitizeErrorMessage(error));
    return handleAIError(error);
  }
}

