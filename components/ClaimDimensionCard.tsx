import { AtomicClaim, ClaimDimension, ClaimVerificationStatus } from "@/types";
import { CheckCircle2, XCircle, HelpCircle, MapPin, Calendar, Activity, Users, FileText } from "lucide-react";

interface ClaimDimensionCardProps {
  claim: AtomicClaim;
}

const dimensionIcons: Record<ClaimDimension, React.ReactNode> = {
  what: <Activity className="h-3.5 w-3.5 text-black" />,
  where: <MapPin className="h-3.5 w-3.5 text-black" />,
  when: <Calendar className="h-3.5 w-3.5 text-black" />,
  who: <Users className="h-3.5 w-3.5 text-black" />,
  other: <FileText className="h-3.5 w-3.5 text-black" />,
};

const dimensionLabels: Record<ClaimDimension, string> = {
  what: "WHAT [EVENT / PHENOMENON]",
  where: "WHERE [GEOGRAPHIC LOCATION]",
  when: "WHEN [TEMPORAL MARKER]",
  who: "WHO [ENTITIES / PERSONS]",
  other: "CONTEXT [AUXILIARY CLAIMS]",
};

const statusConfig: Record<
  ClaimVerificationStatus,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  supported: {
    label: "SUPPORTED",
    bg: "bg-white",
    text: "text-black",
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-black" />,
  },
  contradicted: {
    label: "CONTRADICTED",
    bg: "bg-[#FF3B00]",
    text: "text-black",
    icon: <XCircle className="h-3.5 w-3.5 text-black" />,
  },
  insufficient: {
    label: "INSUFFICIENT EVIDENCE",
    bg: "bg-black",
    text: "text-white",
    icon: <HelpCircle className="h-3.5 w-3.5 text-white" />,
  },
};

export function ClaimDimensionCard({ claim }: ClaimDimensionCardProps) {
  const status = statusConfig[claim.status];

  return (
    <div className="border-2 border-black bg-white p-4 font-mono text-left space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-black">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center border border-black bg-[#F4F1EA]">
            {dimensionIcons[claim.type]}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-black">
            {dimensionLabels[claim.type]}
          </span>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold border border-black ${status.bg} ${status.text}`}
        >
          {status.icon}
          <span>{status.label}</span>
          <span className="opacity-90">
            [{Math.round(claim.confidenceScore * 100)}%]
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-serif font-bold text-black leading-snug">
          &ldquo;{claim.claimText}&rdquo;
        </p>
        <p className="text-xs text-neutral-800 leading-relaxed bg-[#F4F1EA] p-2.5 border border-black">
          <strong>FORENSIC ANALYSIS:</strong> {claim.explanation}
        </p>
      </div>

      {claim.evidenceIds.length > 0 && (
        <div className="pt-1 flex items-center gap-2 text-[11px] text-black">
          <span className="font-bold uppercase text-[10px]">LINKED CITATIONS:</span>
          {claim.evidenceIds.map((id) => (
            <span
              key={id}
              className="border border-black bg-white px-1.5 py-0.5 text-[10px] font-bold"
            >
              #{id}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

