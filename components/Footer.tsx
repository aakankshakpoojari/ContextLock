import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t-2 border-black bg-[#F4F1EA] text-black font-mono">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-black">
          {/* Colophon Column 1 (6 cols) */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center border border-black bg-black text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-serif text-xl font-bold uppercase tracking-tight">
                ContextLock
              </span>
            </div>
            <p className="text-xs uppercase font-bold tracking-wider max-w-md">
              A multimodal investigative system built on Google Gemini 2.5 Flash. Real media can carry false context. Real media ≠ truthful context.
            </p>
            <div className="inline-block border border-black bg-white px-2.5 py-1 text-[11px] font-bold">
              SYS_ID: GEMINI-TRACK-TRUST-SYNTHETIC-2026
            </div>
          </div>

          {/* Colophon Column 2 (3 cols) */}
          <div className="md:col-span-3 space-y-2 text-xs">
            <div className="border-b border-black pb-1 font-bold uppercase tracking-widest text-[#FF3B00]">
              [DISPATCH SPEC]
            </div>
            <p className="font-mono text-[11px] leading-relaxed">
              <strong>MODEL:</strong> Google Gemini 2.5 Flash<br />
              <strong>PIPELINE:</strong> Multimodal Decomp + Search Grounding<br />
              <strong>OUTPUT:</strong> Structured Veracity Audit
            </p>
          </div>

          {/* Colophon Column 3 (3 cols) */}
          <div className="md:col-span-3 space-y-2 text-xs">
            <div className="border-b border-black pb-1 font-bold uppercase tracking-widest text-black">
              [DEVELOPMENT CREDITS]
            </div>
            <p className="text-[11px] leading-relaxed">
              Engineered by <strong>Team A²</strong><br />
              &bull; Aakanksha K Poojari<br />
              &bull; Atmika Nayak<br />
              <em>Google Gemini Hack Days 2026</em>
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-black uppercase font-bold">
          <div>
            &copy; 2026 CONTEXTLOCK. ALL RIGHTS RESERVED. RIGIDLY STRUCTURED.
          </div>
          <div className="flex items-center gap-4">
            <span className="border-b border-black">STRICT EDITORIAL SPECIFICATION</span>
            <span className="border-b border-black">NO HALLUCINATIONS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

