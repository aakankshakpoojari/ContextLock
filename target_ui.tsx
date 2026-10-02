"use client";

import { useState } from "react";
import {
  Upload,
  Search,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Clock,
  Layers,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import {
  VerificationResult,
  MediaType,
  ContextStatus,
} from "@/types";
import { ClaimDimensionCard } from "@/components/ClaimDimensionCard";
import { EvidenceCard } from "@/components/EvidenceCard";
import { SyntheticMediaCard } from "@/components/SyntheticMediaCard";

// Initial sample demonstration data
const INITIAL_DEMO_RESULT: VerificationResult = {
  id: "case-mangalore-flood-demo",
  timestamp: new Date().toISOString(),
  media: {
    type: "video",
    fileName: "mangalore_flood_forward.mp4",
  },
  claim: {
    rawText: "This video shows today's massive flooding in Mangalore.",
    sourcePlatform: "WhatsApp Forward",
    claimedDate: "Today (Current)",
    claimedLocation: "Mangalore, Karnataka",
  },
  contextStatus: "temporal_mismatch",
  summaryExplanation:
    "The video authenticates genuine severe waterlogging in Mangalore. However, investigative evidence confirms this exact recording originated during torrential rains on August 14, 2023. The temporal claim ('today') is contradicted by official weather logs and historical broadcasts.",
  atomicClaims: [
    {
      id: "claim-what-01",
      type: "what",
      claimText: "Massive urban inundation and submerged vehicles",
      status: "supported",
      confidenceScore: 0.95,
      explanation:
        "Visual signs, vehicle submersion, and water levels match severe monsoon street inundation.",
      evidenceIds: ["ev-01"],
    },
    {
      id: "claim-where-01",
      type: "where",
      claimText: "Mangalore (Kottara Chowki junction)",
      status: "supported",
      confidenceScore: 0.92,
      explanation:
        "Commercial hoardings in Kannada/English and highway flyover architecture match Kottara Chowki, Mangalore.",
      evidenceIds: ["ev-01", "ev-02"],
    },
    {
      id: "claim-when-01",
      type: "when",
      claimText: "Happening today / current live situation",
      status: "contradicted",
      confidenceScore: 0.98,
      explanation:
        "Contradicted by archive records: video was originally published August 2023. Today's meteorological data indicates dry conditions.",
      evidenceIds: ["ev-02", "ev-03"],
    },
  ],
  evidence: [
    {
      id: "ev-01",
      title: "Monsoon Inundation in Kottara Chowki: Local Report",
      url: "https://example.com/news/mangalore-floods-august-2023",
      source: "Coastal News Bureau",
      publishedDate: "2023-08-14",
      snippet:
        "Water levels rose rapidly near Kottara Chowki following torrential rainfall on August 14, 2023, inundating major road arteries.",
      relationship: "supports",
      reliabilityScore: 0.92,
    },
    {
      id: "ev-02",
      title: "Fact Check: 2023 Mangalore Flood Video Resurfaces as Current",
      url: "https://example.com/factcheck/mangalore-flood-video-2023",
      source: "Independent Fact Checkers",
      publishedDate: "2024-06-10",
      snippet:
        "A recurring video claiming to show fresh flooding in coastal Karnataka is actually archive footage from the 2023 monsoon season.",
      relationship: "contradicts",
      reliabilityScore: 0.97,
    },
    {
      id: "ev-03",
      title: "Mangalore Daily Weather & Precipitation Log",
      url: "https://example.com/weather/mangalore-today",
      source: "State Disaster Monitoring Center",
      publishedDate: new Date().toISOString().split("T")[0],
      snippet:
        "Clear to partly cloudy skies recorded across Mangalore urban limits. No flood warnings in effect.",
      relationship: "contradicts",
      reliabilityScore: 0.95,
    },
  ],
  syntheticMediaAnalysis: {
    status: "no_strong_indicators",
    confidence: "medium",
    indicators: [
      {
        category: "temporal_consistency",
        observation:
          "Continuous vehicle motion and fluid hydraulic displacement show physical coherence across frames without boundary jitter or warping.",
        severity: "low",
      },
      {
        category: "lighting",
        observation:
          "Monsoon overcast light distribution matches wet surface reflections and diffuse shadow geometry across vehicles and street signs.",
        severity: "low",
      },
      {
        category: "visual_artifact",
        observation:
          "Compression artifacts are consistent with standard H.264 social media re-encoding rather than generative neural synthesis anomalies.",
        severity: "low",
      },
    ],
    explanation:
      "Forensic multimodal inspection indicates that the media exhibits natural optical, temporal, and physical properties without observable generative AI tampering. However, the media is presented with false temporal context ('today').",
  },
  geminiModelUsed: "Google Gemini 2.5 Flash",
};

const contextStatusDisplay: Record<
  ContextStatus,
  { label: string; description: string; badgeBg: string; textCol: string; icon: React.ReactNode }
> = {
  temporal_mismatch: {
    label: "TEMPORAL MISMATCH",
    description: "The media is authentic, but it is an older recording being presented as current.",
    badgeBg: "bg-[#FF3B00]",
    textCol: "text-black",
    icon: <Clock className="h-5 w-5 text-black" />,
  },
  context_mismatch: {
    label: "CONTEXT MISMATCH",
    description: "The media appears genuine, but the accompanying narrative is factually false.",
    badgeBg: "bg-[#FF3B00]",
    textCol: "text-black",
    icon: <AlertTriangle className="h-5 w-5 text-black" />,
  },
  geographic_mismatch: {
    label: "GEOGRAPHIC MISMATCH",
    description: "The media is real, but it is being falsely attributed to a different location.",
    badgeBg: "bg-black",
    textCol: "text-white",
    icon: <ShieldAlert className="h-5 w-5 text-white" />,
  },
  event_mismatch: {
    label: "EVENT MISMATCH",
    description: "The media is real, but it depicts a completely different event than claimed.",
    badgeBg: "bg-[#FF3B00]",
    textCol: "text-black",
    icon: <AlertTriangle className="h-5 w-5 text-black" />,
  },
  claim_supported: {
    label: "CLAIM SUPPORTED",
    description: "Both media and accompanying claim are corroborated by available evidence.",
    badgeBg: "bg-white",
    textCol: "text-black",
    icon: <CheckCircle2 className="h-5 w-5 text-black" />,
  },
  unverified: {
    label: "INSUFFICIENT EVIDENCE",
    description: "Available verified evidence is currently insufficient to determine veracity.",
    badgeBg: "bg-[#F4F1EA]",
    textCol: "text-black",
    icon: <HelpCircle className="h-5 w-5 text-black" />,
  },
};

export default function VerifyWorkspace() {
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [claimText, setClaimText] = useState(
    "This video shows today's massive flooding in Mangalore."
  );
  const [sourcePlatform, setSourcePlatform] = useState("WhatsApp Forward");
  const [claimedLocation, setClaimedLocation] = useState("Mangalore, Karnataka");
  const [claimedDate, setClaimedDate] = useState("Today");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(
    "mangalore_flood_forward.mp4"
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(INITIAL_DEMO_RESULT);

  const handleFileUpload = async (file: File) => {
    setSelectedFileName(file.name);
    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (caseId) {
      formData.append("caseId", caseId);
    }

    try {
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setCaseId(data.media.caseId);
      setMediaId(data.media.id);
      setMediaType(data.media.mediaType);
    } catch (err: unknown) {
      console.error("Upload error:", err);
      setUploadError(err instanceof Error ? err.message : "Failed to upload media");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSimulateVerification = async () => {
    setIsVerifying(true);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media: {
            id: mediaId || undefined,
            type: mediaType,
            fileName: selectedFileName || "uploaded-media.jpg",
          },
          claim: {
            rawText: claimText,
            sourcePlatform,
            claimedDate,
            claimedLocation,
          },
        }),
      });

      if (response.ok) {
        const data: VerificationResult = await response.json();
        setResult(data);
      } else {
        setResult(INITIAL_DEMO_RESULT);
      }
    } catch (err) {
      console.error("Failed to query verification API:", err);
      setResult(INITIAL_DEMO_RESULT);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="py-8 sm:py-12 font-mono">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Workspace Top Header */}
        <div className="border-b-2 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
          <div className="space-y-2">
            <div className="inline-block border border-black bg-black text-white px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest">
              [ FORENSIC CONSOLE // INVESTIGATION WORKSPACE ]
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-black uppercase tracking-tight text-black">
              Investigate Context
            </h1>
            <p className="text-xs sm:text-sm text-black max-w-2xl">
              Provide suspect media and the claimed caption. ContextLock decomposes claims into verifiable atomic nodes and queries grounding truth engines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setResult(INITIAL_DEMO_RESULT)}
              className="inline-flex items-center gap-2 border-2 border-black bg-white hover:bg-black text-black hover:text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-none"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Case Demo</span>
            </button>
          </div>
        </div>

        {/* Input Form & Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
          {/* Left Column: Media & Claim Inputs (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Step 1: Media Input */}
            <div className="border-2 border-black bg-white p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                <span className="text-xs font-bold uppercase tracking-wider text-black">
                  [STEP 01] MEDIA SPECIMEN
                </span>
                <div className="flex items-center border border-black bg-white text-xs">
                  <button
                    type="button"
                    onClick={() => setMediaType("image")}
                    className={`px-3 py-1 font-bold uppercase transition-none ${
                      mediaType === "image"
                        ? "bg-black text-white"
                        : "text-black hover:bg-[#F4F1EA]"
                    }`}
                  >
                    Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType("video")}
                    className={`px-3 py-1 font-bold uppercase transition-none border-l border-black ${
                      mediaType === "video"
                        ? "bg-black text-white"
                        : "text-black hover:bg-[#F4F1EA]"
                    }`}
                  >
                    Video
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label
                  htmlFor="media-file-input"
                  className={`flex flex-col items-center justify-center border-2 border-dashed border-black bg-[#F4F1EA] p-6 text-center cursor-pointer hover:bg-white transition-none ${
                    isUploading ? "opacity-60 cursor-wait" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center border border-black bg-white text-black">
                    {isUploading ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                  </div>
                  <p className="mt-3 text-xs font-bold uppercase text-black">
                    {isUploading ? "INGESTING MEDIA..." : `SELECT OR DROP ${mediaType.toUpperCase()} FILE`}
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-600">
                    JPG, PNG, WEBP, MP4, MOV (MAX 100MB)
                  </p>
                  <input
                    id="media-file-input"
                    type="file"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>

                {uploadError && (
                  <div className="mt-3 border-2 border-black bg-[#FF3B00] p-2 text-xs font-bold text-black flex items-center gap-2">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <span>ERROR: {uploadError}</span>
                  </div>
                )}

                {selectedFileName && !uploadError && (
                  <div className="mt-3 border border-black bg-[#F4F1EA] p-2 flex items-center justify-between text-xs">
                    <span className="font-bold truncate max-w-[220px]">
                      FILE: {selectedFileName}
                    </span>
                    <span className="border border-black bg-white px-1.5 py-0.5 text-[10px] font-bold">
                      {isUploading ? "UPLOADING" : mediaId ? "READY_STORED" : "READY"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Context / Claim Inputs */}
            <div className="border-2 border-black bg-white p-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-black block pb-3 border-b-2 border-black">
                [STEP 02] CLAIM NARRATIVE / CONTEXT
              </span>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold uppercase text-black mb-1">
                    FORWARDED CLAIM / CAPTION:
                  </label>
                  <textarea
                    rows={3}
                    value={claimText}
                    onChange={(e) => setClaimText(e.target.value)}
                    placeholder="e.g. 'This video shows today's massive flooding in Mangalore.'"
                    className="w-full border-2 border-black bg-[#F4F1EA] p-2.5 text-xs text-black placeholder-neutral-500 focus:bg-white focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase text-black mb-1">
                      CLAIMED LOCATION:
                    </label>
                    <input
                      type="text"
                      value={claimedLocation}
                      onChange={(e) => setClaimedLocation(e.target.value)}
                      placeholder="e.g. Mangalore"
                      className="w-full border-2 border-black bg-[#F4F1EA] p-2 text-xs text-black focus:bg-white focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-black mb-1">
                      CLAIMED DATE / TIME:
                    </label>
                    <input
                      type="text"
                      value={claimedDate}
                      onChange={(e) => setClaimedDate(e.target.value)}
                      placeholder="e.g. Today"
                      className="w-full border-2 border-black bg-[#F4F1EA] p-2 text-xs text-black focus:bg-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase text-black mb-1">
                    SOURCE PLATFORM / VECTOR:
                  </label>
                  <input
                    type="text"
                    value={sourcePlatform}
                    onChange={(e) => setSourcePlatform(e.target.value)}
                    placeholder="e.g. WhatsApp Forward, X / Twitter"
                    className="w-full border-2 border-black bg-[#F4F1EA] p-2 text-xs text-black focus:bg-white focus:outline-none font-mono"
                  />
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={handleSimulateVerification}
                  disabled={isVerifying}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 border-2 border-black bg-black hover:bg-[#FF3B00] text-white hover:text-black py-3.5 px-4 text-xs font-bold uppercase tracking-wider transition-none disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>DECONSTRUCTING CLAIMS...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span>EXECUTE CONTEXT AUDIT</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Verification Results (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {result ? (
              <>
                {/* Result Status Banner */}
                <div className="border-2 border-black bg-white p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-black gap-3">
                    <div className="flex items-center gap-3">
                      <div className="border-2 border-black bg-[#F4F1EA] p-2">
                        {contextStatusDisplay[result.contextStatus]?.icon}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                          FORENSIC VERDICT // CONTEXT INTEGRITY
                        </span>
                        <h2 className="font-serif text-2xl font-black uppercase text-black">
                          {contextStatusDisplay[result.contextStatus]?.label}
                        </h2>
                      </div>
                    </div>

                    <div
                      className={`inline-flex items-center px-3 py-1 text-xs font-bold uppercase border-2 border-black ${
                        contextStatusDisplay[result.contextStatus]?.badgeBg
                      } ${contextStatusDisplay[result.contextStatus]?.textCol}`}
                    >
                      {contextStatusDisplay[result.contextStatus]?.label}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed text-black bg-[#F4F1EA] p-3.5 border border-black">
                    {result.summaryExplanation}
                  </p>

                  <div className="pt-2 border-t border-black flex flex-wrap items-center justify-between text-[11px] text-black gap-2 font-bold uppercase">
                    <span>TARGET: &ldquo;{result.claim.rawText}&rdquo;</span>
                    {result.geminiModelUsed && (
                      <span className="text-[#FF3B00]">&bull; {result.geminiModelUsed}</span>
                    )}
                  </div>
                </div>

                {/* Layer 01: Synthetic Media Analysis */}
                {result.syntheticMediaAnalysis && (
                  <SyntheticMediaCard
                    analysis={result.syntheticMediaAnalysis}
                    mediaType={result.media?.type}
                  />
                )}

                {/* Layer 02: Atomic Claims Deconstruction Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
                      <Layers className="h-4 w-4 text-black" />
                      <span>ATOMIC CLAIM DECONSTRUCTION MATRIX</span>
                    </h3>
                    <span className="border border-black bg-white px-2 py-0.5 text-[10px] font-bold">
                      {result.atomicClaims.length} CLAIMS
                    </span>
                  </div>

                  <div className="space-y-3">
                    {result.atomicClaims.map((claim) => (
                      <ClaimDimensionCard key={claim.id} claim={claim} />
                    ))}
                  </div>
                </div>

                {/* Evidence & Grounding Sources Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
                      <FileText className="h-4 w-4 text-black" />
                      <span>GROUNDED CITATIONS &amp; EXTERNAL EVIDENCE</span>
                    </h3>
                    <span className="border border-black bg-white px-2 py-0.5 text-[10px] font-bold">
                      {result.evidence.length} SOURCES
                    </span>
                  </div>

                  <div className="space-y-3">
                    {result.evidence.map((ev) => (
                      <EvidenceCard key={ev.id} evidence={ev} />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="border-2 border-dashed border-black bg-white p-12 text-center space-y-3">
                <Search className="h-10 w-10 text-black mx-auto" />
                <h3 className="font-serif text-xl font-bold uppercase text-black">
                  No Active Case Investigation
                </h3>
                <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                  Submit media and narrative on the left to deconstruct atomic claims and trace external evidence.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

