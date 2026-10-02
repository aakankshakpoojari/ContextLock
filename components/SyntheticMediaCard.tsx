import {
  SyntheticMediaAnalysis,
  SyntheticMediaStatus,
  SyntheticIndicatorCategory,
  IndicatorSeverity,
} from "@/types";
import {
  Cpu,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Eye,
  Sparkles,
  SunMedium,
  Shapes,
  Type,
  Maximize2,
  Film,
  Volume2,
  Info,
} from "lucide-react";

interface SyntheticMediaCardProps {
  analysis: SyntheticMediaAnalysis;
  mediaType?: "image" | "video";
}

const statusConfig: Record<
  SyntheticMediaStatus,
  {
    label: string;
    description: string;
    badgeBg: string;
    textCol: string;
    icon: React.ReactNode;
  }
> = {
  synthetic_indicators: {
    label: "SYNTHETIC INDICATORS DETECTED",
    description:
      "Observable technical characteristics consistent with generative AI synthesis, deepfakes, or digital manipulation were detected.",
    badgeBg: "bg-[#FF3B00]",
    textCol: "text-black",
    icon: <AlertTriangle className="h-4 w-4 text-black" />,
  },
  no_strong_indicators: {
    label: "NO STRONG SYNTHETIC INDICATORS DETECTED",
    description:
      "Visual and structural characteristics appear consistent with natural capture. No obvious generative anomalies were identified.",
    badgeBg: "bg-white",
    textCol: "text-black",
    icon: <CheckCircle2 className="h-4 w-4 text-black" />,
  },
  inconclusive: {
    label: "INCONCLUSIVE ASSESSMENT",
    description:
      "Media quality, heavy compression, low resolution, or ambiguous lighting prevents a high-confidence synthetic determination.",
    badgeBg: "bg-black",
    textCol: "text-white",
    icon: <HelpCircle className="h-4 w-4 text-white" />,
  },
};

const categoryIcons: Record<SyntheticIndicatorCategory, React.ReactNode> = {
  visual_artifact: <Eye className="h-3.5 w-3.5 text-black" />,
  facial_consistency: <Sparkles className="h-3.5 w-3.5 text-black" />,
  lighting: <SunMedium className="h-3.5 w-3.5 text-black" />,
  geometry: <Shapes className="h-3.5 w-3.5 text-black" />,
  text: <Type className="h-3.5 w-3.5 text-black" />,
  reflection: <Maximize2 className="h-3.5 w-3.5 text-black" />,
  temporal_consistency: <Film className="h-3.5 w-3.5 text-black" />,
  audio_visual: <Volume2 className="h-3.5 w-3.5 text-black" />,
  other: <Info className="h-3.5 w-3.5 text-black" />,
};

const categoryLabels: Record<SyntheticIndicatorCategory, string> = {
  visual_artifact: "VISUAL ARTIFACTS",
  facial_consistency: "FACIAL & ANATOMY CONSISTENCY",
  lighting: "LIGHTING & SHADOW COHERENCE",
  geometry: "GEOMETRY & PERSPECTIVE",
  text: "TEXT & GLYPH RENDERING",
  reflection: "REFLECTIONS & CATCHLIGHTS",
  temporal_consistency: "TEMPORAL / FRAME STABILITY",
  audio_visual: "AUDIO-VISUAL SYNC",
  other: "PHYSICAL COHERENCE",
};

const severityConfig: Record<
  IndicatorSeverity,
  { label: string; bg: string; text: string }
> = {
  low: { label: "LOW SEVERITY", bg: "bg-[#F4F1EA]", text: "text-black" },
  medium: { label: "MEDIUM SEVERITY", bg: "bg-black", text: "text-white" },
  high: { label: "HIGH ANOMALY", bg: "bg-[#FF3B00]", text: "text-black" },
};

const confidenceConfig: Record<
  "low" | "medium" | "high",
  { label: string; width: string }
> = {
  low: { label: "LOW CONFIDENCE", width: "33%" },
  medium: { label: "MEDIUM CONFIDENCE", width: "66%" },
  high: { label: "HIGH CONFIDENCE", width: "100%" },
};

export function SyntheticMediaCard({ analysis }: SyntheticMediaCardProps) {
  const status = statusConfig[analysis.status] || statusConfig.inconclusive;
  const conf = confidenceConfig[analysis.confidence] || confidenceConfig.medium;

  return (
    <div className="border-2 border-black bg-white p-5 font-mono text-left space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b-2 border-black gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center border border-black bg-[#F4F1EA]">
            <Cpu className="h-4 w-4 text-black" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block">
              [ FORENSIC LAYER 01 // MEDIA ARTIFACT INSPECTION ]
            </span>
            <span className="font-serif text-lg font-black uppercase text-black">
              Synthetic Media Analysis
            </span>
          </div>
        </div>

        {/* Verdict Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase border-2 border-black ${status.badgeBg} ${status.textCol}`}
        >
          {status.icon}
          <span>{status.label}</span>
        </div>
      </div>

      {/* Confidence & Assessment Description */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
        <div className="md:col-span-8 bg-[#F4F1EA] p-3 border border-black space-y-1">
          <span className="font-bold uppercase text-[10px] text-neutral-600 block">
            VERDICT SUMMARY
          </span>
          <p className="text-xs text-black leading-relaxed font-bold">
            {status.description}
          </p>
        </div>

        <div className="md:col-span-4 bg-[#F4F1EA] p-3 border border-black flex flex-col justify-between">
          <span className="font-bold uppercase text-[10px] text-neutral-600 block">
            SIGNAL CONFIDENCE
          </span>
          <div className="space-y-1.5 mt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-black">
              <span>{conf.label}</span>
              <span className="text-[10px]">{analysis.confidence.toUpperCase()}</span>
            </div>
            <div className="h-2 w-full border border-black bg-white p-0.5">
              <div className="h-full bg-black" style={{ width: conf.width }} />
            </div>
          </div>
        </div>
      </div>

      {/* Observable Indicators Breakdown */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-black pb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-black" />
            <span>OBSERVABLE FORENSIC INDICATORS</span>
          </span>
          <span className="border border-black bg-white px-1.5 py-0.2 text-[10px] font-bold">
            {analysis.indicators.length} OBSERVATION{analysis.indicators.length !== 1 ? "S" : ""}
          </span>
        </div>

        {analysis.indicators.length > 0 ? (
          <div className="space-y-2">
            {analysis.indicators.map((ind, idx) => {
              const sev = severityConfig[ind.severity] || severityConfig.medium;
              const catIcon = categoryIcons[ind.category] || <Info className="h-3.5 w-3.5" />;
              const catLabel = categoryLabels[ind.category] || ind.category.toUpperCase();

              return (
                <div
                  key={idx}
                  className="border border-black bg-[#F4F1EA] p-2.5 space-y-1.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-black/20">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center border border-black bg-white">
                        {catIcon}
                      </div>
                      <span className="font-bold uppercase text-[11px] text-black">
                        {catLabel}
                      </span>
                    </div>

                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-bold border border-black ${sev.bg} ${sev.text}`}
                    >
                      {sev.label}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-900 leading-relaxed pl-1">
                    {ind.observation}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-black bg-[#F4F1EA] p-3 text-xs text-neutral-600">
            No specific visual or acoustic anomalies detected under current resolution limits.
          </div>
        )}
      </div>

      {/* Detailed Technical Explanation */}
      <div className="space-y-1.5 pt-1">
        <span className="font-bold uppercase text-[10px] text-neutral-600 block">
          DETAILED FORENSIC REASONING
        </span>
        <p className="text-xs text-black leading-relaxed bg-[#F4F1EA] p-3 border border-black">
          {analysis.explanation}
        </p>
      </div>

      {/* Forensic Guardrail Disclaimer */}
      <div className="border-t-2 border-black pt-3 flex items-start gap-2 text-[10px] text-neutral-700">
        <Info className="h-3.5 w-3.5 shrink-0 text-black mt-0.5" />
        <p className="leading-tight">
          <strong>FORENSIC NOTICE:</strong> AI-assisted synthetic media analysis provides probabilistic indicator detection, not mathematical proof. Real media may still carry false context, and synthetic media may depict true context. Evaluate context verification findings independently.
        </p>
      </div>
    </div>
  );
}
