import { EvidenceSource, EvidenceRelationship } from "@/types";
import { ExternalLink, ShieldCheck, AlertTriangle, Info, BookOpen } from "lucide-react";

interface EvidenceCardProps {
  evidence: EvidenceSource;
}

const relationshipConfig: Record<
  EvidenceRelationship,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  supports: {
    label: "SUPPORTS CLAIM",
    bg: "bg-white",
    text: "text-black",
    icon: <ShieldCheck className="h-3.5 w-3.5 text-black" />,
  },
  contradicts: {
    label: "CONTRADICTS CLAIM",
    bg: "bg-[#FF3B00]",
    text: "text-black",
    icon: <AlertTriangle className="h-3.5 w-3.5 text-black" />,
  },
  context: {
    label: "HISTORICAL / CONTEXTUAL",
    bg: "bg-black",
    text: "text-white",
    icon: <Info className="h-3.5 w-3.5 text-white" />,
  },
  unrelated: {
    label: "UNRELATED CITATION",
    bg: "bg-[#F4F1EA]",
    text: "text-black",
    icon: <BookOpen className="h-3.5 w-3.5 text-black" />,
  },
};

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  const rel = relationshipConfig[evidence.relationship];

  return (
    <div className="border-2 border-black bg-white p-4 font-mono text-left space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-black">
        <div className="flex items-center gap-2">
          <span className="border border-black bg-black text-white px-1.5 py-0.5 text-[10px] font-bold">
            CIT_{evidence.id.toUpperCase()}
          </span>
          <span className="text-xs font-bold text-black uppercase">
            {evidence.source}
          </span>
          {evidence.publishedDate && (
            <span className="text-[11px] text-neutral-600">
              [{evidence.publishedDate}]
            </span>
          )}
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold border border-black ${rel.bg} ${rel.text}`}
        >
          {rel.icon}
          <span>{rel.label}</span>
        </div>
      </div>

      <h4 className="text-sm font-serif font-bold text-black">
        <a
          href={evidence.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:bg-black hover:text-white px-1 py-0.5 border-b border-black transition-none group"
        >
          <span>{evidence.title}</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </h4>

      <p className="text-xs text-neutral-900 leading-relaxed bg-[#F4F1EA] p-2.5 border border-black">
        &ldquo;{evidence.snippet}&rdquo;
      </p>

      {evidence.reliabilityScore && (
        <div className="pt-1 flex items-center justify-between text-[11px] text-black">
          <span className="font-bold uppercase text-[10px]">SOURCE RELIABILITY:</span>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-24 border border-black bg-white p-0.5">
              <div
                className="h-full bg-black"
                style={{ width: `${Math.round(evidence.reliabilityScore * 100)}%` }}
              />
            </div>
            <span className="font-bold text-[10px]">
              {Math.round(evidence.reliabilityScore * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

