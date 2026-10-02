import { NextRequest, NextResponse } from "next/server";
import { VerifyRequestSchema, VerificationResult, EvidenceSource, AtomicClaim, ContextStatus, MediaInput } from "@/types";
import { getSupabaseClient } from "@/lib/supabase";
import { MEDIA_BUCKET_NAME } from "@/lib/media/storage";
import {
  retrieveEvidence,
} from "@/lib/gemini-service";
import {
  analyzeMedia,
  analyzeEvidence,
  decomposeClaims,
} from "@/lib/ai/provider";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import crypto from "crypto";

const execAsync = promisify(exec);

function logStep(step: string, details?: unknown) {
  if (details) {
    console.log(`[VERIFY] ${step}`, details);
  } else {
    console.log(`[VERIFY] ${step}`);
  }
}


// Extend the existing schema to explicitly require caseId and mediaId for the pipeline
const PipelineRequestSchema = VerifyRequestSchema.extend({
  caseId: z.string().min(1, "caseId is required"),
  mediaId: z.string().min(1, "mediaId is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    logStep("Request received");

    // 1. INPUT VALIDATION
    const validationResult = PipelineRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_REQUEST",
          message: "Invalid verification request payload",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { caseId, mediaId, claim } = validationResult.data;
    logStep("validation", { caseId, mediaId, claimText: claim.rawText });
    const supabase = getSupabaseClient();

    // 2. MEDIA LOADING
    const { data: mediaRecord, error: mediaError } = await supabase
      .from("media")
      .select("*")
      .eq("id", mediaId)
      .eq("case_id", caseId)
      .single();

    if (mediaError || !mediaRecord) {
      return NextResponse.json(
        { success: false, error: "MEDIA_NOT_FOUND", message: "Media not found for the provided case and media IDs." },
        { status: 404 }
      );
    }

    logStep("media lookup", "success");
    // Download media from storage to analyze it
    const { data: storageData, error: storageError } = await supabase.storage
      .from(MEDIA_BUCKET_NAME)
      .download(mediaRecord.storage_path);

    if (storageError || !storageData) {
      return NextResponse.json(
        { success: false, error: "STORAGE_ERROR", message: "Failed to retrieve media file from storage." },
        { status: 500 }
      );
    }
    const arrayBuffer = await storageData.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    // 3. MEDIA ANALYSIS
    logStep("media analysis");
    let mediaObservations;
    let aiModelUsed = "";
    try {
      const aiRes = await analyzeMedia({
        textPrompt: "Analyze the provided media and extract objective, verifiable observations without forming conclusions.",
        mediaParts: [
          {
            inlineData: {
              mimeType: mediaRecord.mime_type,
              data: base64Data,
            },
          },
        ],
      });
      mediaObservations = aiRes.data;
      aiModelUsed = aiRes.model;
    } catch (e: unknown) {
      console.error("[MEDIA] Gemini analysis failed:", e);
      const err = e as { message?: string, status?: number, statusCode?: number };
      console.error("Error details:", {
          message: err.message,
          status: err.status || err.statusCode,
          model: "gemini-3.5-flash-lite", // or whatever model is used
          payloadSize: base64Data.length,
          mimeType: mediaRecord.mime_type,
      });
      return NextResponse.json(
        { success: false, error: "MEDIA_ANALYSIS_FAILED", message: "Media analysis failed." },
        { status: 500 }
      );
    }

    // 4. CLAIM DECOMPOSITION
    logStep("claim decomposition");
    const decompRes = await decomposeClaims(claim.rawText);
    const atomicClaims = decompRes.data;

    // 5. EVIDENCE RETRIEVAL (One single search for the entire claim)
    const allEvidenceSources: EvidenceSource[] = [];
    let overarchingEvidence: EvidenceSource[] = [];
    logStep(`evidence retrieval started for overarching user claim`);
    try {
      const overarchingClaim: AtomicClaim = {
        id: "claim_main",
        type: "other",
        claimText: claim.rawText,
        status: "insufficient",
        confidenceScore: 0,
        explanation: "",
        evidenceIds: [],
      };
      
      overarchingEvidence = await retrieveEvidence(overarchingClaim, atomicClaims);
      logStep(`evidence retrieval finished, count: ${overarchingEvidence.length}`);
    } catch (err) {
      console.error(`Evidence retrieval failed for main claim:`, err);
      logStep("EVIDENCE_RETRIEVAL_FAILED", err instanceof Error ? err.message : String(err));
    }

    // 6. REASONING (Sequential per claim)
    const processedAtomicClaims: AtomicClaim[] = [];

    for (let i = 0; i < atomicClaims.length; i++) {
      const ac = atomicClaims[i];

      let reasoningResult;
      try {
        logStep(`reasoning started for claim ${ac.id}`);
        const resRes = await analyzeEvidence(ac, overarchingEvidence, atomicClaims);
        reasoningResult = resRes.data;
        logStep(`reasoning finished for claim ${ac.id}`);
      } catch (err) {
        console.error(`Reasoning failed for claim ${ac.id}:`, err);
        logStep("REASONING_FAILED", err instanceof Error ? err.message : String(err));
        throw new Error(`Reasoning failed: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Merge evidence relationships and add to overall list
      overarchingEvidence.forEach((ev) => {
        // Deep clone to avoid mutating the shared overarchingEvidence
        const clonedEv = { ...ev };
        const rel = reasoningResult.evidenceRelationships.find((r: { evidenceId: string, relationship: string }) => r.evidenceId === clonedEv.id);
        if (rel) {
          clonedEv.relationship = rel.relationship;
        } else {
          clonedEv.relationship = "unrelated";
        }
        
        // Track the strongest relationship for each evidence across all claims
        const existingEvIndex = allEvidenceSources.findIndex(e => e.id === clonedEv.id);
        if (existingEvIndex === -1) {
          allEvidenceSources.push(clonedEv);
        } else {
          // Upgrade relationship if necessary (supports > context > unrelated)
          const currentRel = allEvidenceSources[existingEvIndex].relationship;
          const newRel = clonedEv.relationship;
          
          if (newRel === "supports" && currentRel !== "supports") {
            allEvidenceSources[existingEvIndex].relationship = "supports";
          } else if (newRel === "contradicts" && currentRel !== "supports" && currentRel !== "contradicts") {
            allEvidenceSources[existingEvIndex].relationship = "contradicts";
          } else if (newRel === "context" && currentRel === "unrelated") {
            allEvidenceSources[existingEvIndex].relationship = "context";
          }
        }
      });

      processedAtomicClaims.push({
        id: ac.id,
        type: ac.type,
        claimText: ac.claimText,
        status: reasoningResult.status,
        confidenceScore: 0.9,
        explanation: reasoningResult.explanation,
        evidenceIds: overarchingEvidence.map((e) => e.id),
      });
    }


    // 7. RESULT AGGREGATION & CONTEXT STATUS
    // Derive ContextStatus based on atomic claim statuses conservatively
    const hasInsufficient = processedAtomicClaims.some(c => c.status === "insufficient");
    const contradictedClaims = processedAtomicClaims.filter(c => c.status === "contradicted");
    
    let overallContextStatus: ContextStatus = "claim_supported";
    if (contradictedClaims.length > 0) {
      // Determine specific mismatch type
      const contradictedTypes = contradictedClaims.map(c => c.type);
      if (contradictedTypes.includes("when")) {
        overallContextStatus = "temporal_mismatch";
      } else if (contradictedTypes.includes("where")) {
        overallContextStatus = "geographic_mismatch";
      } else if (contradictedTypes.includes("what")) {
        overallContextStatus = "event_mismatch";
      } else {
        overallContextStatus = "context_mismatch";
      }
    } else if (hasInsufficient) {
      overallContextStatus = "unverified";
    }

    const mediaInput: MediaInput = {
      id: mediaRecord.id,
      type: mediaRecord.type,
      fileName: mediaRecord.metadata?.originalName || "media_file",
      fileSize: mediaRecord.metadata?.size,
      mimeType: mediaRecord.mime_type,
      url: mediaRecord.storage_path,
    };

    const verificationResult: VerificationResult = {
      id: `verif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      media: mediaInput,
      claim: claim,
      contextStatus: overallContextStatus,
      summaryExplanation: `The claim was evaluated against external evidence. The overall status is determined as ${overallContextStatus} based on the underlying atomic claims.`,
      atomicClaims: processedAtomicClaims,
      evidence: allEvidenceSources,
      geminiModelUsed: aiModelUsed,
    };

    // 8. ZK PROOF GENERATION
    logStep("generating ZK proof");
    try {
      // Create numeric fields for Noir
      // Hash strings to 32 bytes, then take first 15 bytes to ensure they fit in a Noir Field
      const mediaHashHex = crypto.createHash('sha256').update(mediaRecord.id).digest('hex').substring(0, 30);
      const claimHashHex = crypto.createHash('sha256').update(claim.rawText).digest('hex').substring(0, 30);
      
      const mediaHashField = BigInt('0x' + mediaHashHex).toString(10);
      const claimHashField = BigInt('0x' + claimHashHex).toString(10);
      
      // Mapping verdict to a number
      let verdictNum = "0";
      if (overallContextStatus === "claim_supported") verdictNum = "1";
      else if (overallContextStatus === "unverified") verdictNum = "2";
      else verdictNum = "3"; // mismatch/contradicted

      const nonce = Math.floor(Math.random() * 1000000).toString(10);

      // Execute the prove script
      const { stdout } = await execAsync(`npx tsx zk/scripts/prove.ts ${mediaHashField} ${claimHashField} ${verdictNum} ${nonce}`);
      
      const jsonStart = stdout.indexOf('{');
      const zkRes = JSON.parse(stdout.substring(jsonStart));
      
      verificationResult.zkReceipt = {
        commitment: zkRes.commitment,
        proof: zkRes.proof,
        verdict: overallContextStatus
      };
      
      logStep("ZK proof generation complete", zkRes.commitment);
    } catch (zkErr) {
      console.error("ZK Proof generation failed:", zkErr);
      logStep("ZK_PROOF_FAILED", zkErr instanceof Error ? zkErr.message : String(zkErr));
      // Continue without ZK proof if it fails (graceful degradation)
    }

    // Return VerificationResult-compatible response
    logStep("final result", overallContextStatus);
    return NextResponse.json(verificationResult, { status: 200 });

  } catch (err: unknown) {
    console.error("Verification Pipeline Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
