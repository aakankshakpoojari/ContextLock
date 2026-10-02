import re

with open('app/api/verify/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add logging functions at top
logging_add = """import { z } from "zod";

function logStep(step: string, details?: any) {
  if (details) {
    console.log(`[VERIFY] ${step}`, details);
  } else {
    console.log(`[VERIFY] ${step}`);
  }
}
"""
content = content.replace('import { z } from "zod";', logging_add)

# Change Promise.all to sequential
seq_replace = """    // 5 & 6. EVIDENCE RETRIEVAL & REASONING (Sequential per claim to avoid GDELT 429)
    const allEvidenceSources: EvidenceSource[] = [];
    const processedAtomicClaims: AtomicClaim[] = [];

    for (let i = 0; i < atomicClaims.length; i++) {
      const ac = atomicClaims[i];
      let retrievedEvidence: EvidenceSource[] = [];
      try {
        logStep(`evidence retrieval started for claim ${ac.id}`);
        retrievedEvidence = await retrieveEvidence(ac, atomicClaims);
        logStep(`evidence retrieval finished for claim ${ac.id}, count: ${retrievedEvidence.length}`);
      } catch (err) {
        console.error(`Evidence retrieval failed for claim ${ac.id}:`, err);
      }

      let reasoningResult;
      try {
        logStep(`reasoning started for claim ${ac.id}`);
        reasoningResult = await analyzeEvidence(ac, retrievedEvidence, atomicClaims);
        logStep(`reasoning finished for claim ${ac.id}`);
      } catch (err) {
        console.error(`Reasoning failed for claim ${ac.id}:`, err);
        reasoningResult = {
          status: "insufficient" as const,
          explanation: "Reasoning analysis failed or was unavailable.",
          evidenceRelationships: []
        };
      }

      retrievedEvidence.forEach((ev) => {
        const rel = reasoningResult.evidenceRelationships.find((r: any) => r.evidenceId === ev.id);
        if (rel) {
          ev.relationship = rel.relationship;
        } else {
          ev.relationship = "unrelated";
        }
        allEvidenceSources.push(ev);
      });

      processedAtomicClaims.push({
        id: ac.id,
        type: ac.type,
        claimText: ac.claimText,
        status: reasoningResult.status,
        confidenceScore: 0.9,
        explanation: reasoningResult.explanation,
        evidenceIds: retrievedEvidence.map((e) => e.id),
      });
      
      // Delay to avoid GDELT rate limits on next claim
      if (i < atomicClaims.length - 1) {
        logStep(`waiting 6 seconds before next claim evidence retrieval to respect GDELT rate limit`);
        await new Promise(resolve => setTimeout(resolve, 6000));
      }
    }
"""
content = re.sub(r'    // 5 & 6\. EVIDENCE RETRIEVAL.*await Promise\.all\(claimPromises\);', seq_replace, content, flags=re.DOTALL)

# Add logging
content = content.replace('const body = await req.json();', 'const body = await req.json();\n    logStep("Request received");')
content = content.replace('const { caseId, mediaId, claim } = validationResult.data;', 'const { caseId, mediaId, claim } = validationResult.data;\n    logStep("validation", { caseId, mediaId, claimText: claim.rawText });')
content = content.replace('// Download media from storage', 'logStep("media lookup", "success");\n    // Download media from storage')
content = content.replace('let mediaObservations;', 'logStep("media analysis");\n    let mediaObservations;')
content = content.replace('const atomicClaims = await decomposeClaims(claim.rawText);', 'logStep("claim decomposition");\n    const atomicClaims = await decomposeClaims(claim.rawText);')
content = content.replace('return NextResponse.json(verificationResult, { status: 200 });', 'logStep("final result", overallContextStatus);\n    return NextResponse.json(verificationResult, { status: 200 });')

# Replace generic error messages with structured ones and add step logs
content = content.replace('{ error: "Media not found for the provided case and media IDs." }', '{ success: false, error: "MEDIA_NOT_FOUND", message: "Media not found for the provided case and media IDs." }')
content = content.replace('{ error: "Failed to retrieve media file from storage." }', '{ success: false, error: "STORAGE_ERROR", message: "Failed to retrieve media file from storage." }')
content = content.replace('{ error: "Media analysis failed." }', '{ success: false, error: "MEDIA_ANALYSIS_FAILED", message: "Media analysis failed." }')
content = content.replace('error: "Invalid verification request payload",', 'success: false,\n          error: "INVALID_REQUEST",\n          message: "Invalid verification request payload",')
content = content.replace('error: "Internal server error during verification request processing",', 'success: false,\n        error: "INTERNAL_SERVER_ERROR",')

with open('app/api/verify/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)
