import Link from "next/link";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Split,
  FileSearch,
  Database,
  Layers,
  FileCheck2,
  Terminal,
} from "lucide-react";
import { TypewriterText } from "@/components/TypewriterText";

export default function HomePage() {
  return (
    <div className="py-8 sm:py-12 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Animated Top Header / Metadata Bar */}
        <div className="relative pb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-bold uppercase tracking-wider">
          <div className="flex items-center gap-3">
            <span className="bg-black text-white px-2 py-0.5">
              <TypewriterText text="ISSUE 01" delay={50} speed={25} />
            </span>
            
          </div>
          <div className="flex items-center gap-2">
            <span className="border border-black bg-white px-2 py-0.5">
              <TypewriterText text="DISPATCH_STATUS: ACTIVE" delay={450} speed={15} />
            </span>
            <span className="bg-[#FF3B00] text-black px-2 py-0.5">
              <TypewriterText text="SECURITY_LEVEL: 0" delay={600} speed={15} />
            </span>
          </div>

          {/* Animated 2px Divider Line Drawing In */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black animate-draw-x" />
        </div>

        {/* Hero Section: Staggered Mask Reveals & Balanced Editorial Dossier */}
        <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pb-12">
          {/* Left Column: Headlines & Manifesto (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-left flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-block border border-black bg-white px-3 py-1 text-xs font-mono font-bold uppercase tracking-widest text-black">
                [ MANIFESTO // MEDIA CONTEXT AUDIT ]
              </div>

              {/* Staggered Mask Reveal for Massive Headline */}
              <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight text-black leading-[0.9]">
                <span className="block overflow-hidden py-1">
                  <span className="animate-mask-1">Real Media.</span>
                </span>
                <span className="block overflow-hidden py-1">
                  <span className="animate-mask-2 text-[#FF3B00] underline decoration-4 underline-offset-4">
                    False Context.
                  </span>
                </span>
              </h1>

              {/* Delayed Body Copy Animation */}
              <div className="border-l-4 border-black pl-4 py-1 space-y-2 animate-fade-delayed">
                <p className="font-serif text-xl sm:text-2xl font-bold text-black leading-snug">
                  We don&apos;t just verify whether pixels are synthetic. We verify whether the story told about them is true.
                </p>
                <p className="font-mono text-xs sm:text-sm text-black leading-relaxed">
                  Misinformation rarely needs deepfakes. Authentic footage from 2021 forwarded as &ldquo;happening today&rdquo; bypasses every conventional pixel detector. ContextLock deconstructs claims into atomic components (What, Where, When, Who) and cross-references external ground truth using Google Gemini.
                </p>
              </div>
            </div>

            {/* Brutalist Action Bar & Metrics with Delayed Fade */}
            <div className="space-y-4 pt-2 animate-fade-delayed-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 font-mono">
                <Link
                  href="/verify"
                  className="inline-flex items-center justify-center gap-3 border-2 border-black bg-black hover:bg-[#FF3B00] text-white hover:text-black px-6 py-4 text-sm font-bold uppercase tracking-wider transition-none"
                >
                  <Search className="h-4 w-4" />
                  <span>Launch Verification Engine</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#thesis"
                  className="inline-flex items-center justify-center gap-2 border-2 border-black bg-white hover:bg-black text-black hover:text-white px-5 py-4 text-sm font-bold uppercase tracking-wider transition-none"
                >
                  <span>Read The Thesis</span>
                </a>
              </div>

              {/* Stark Monospace Metric Strip */}
              <div className="grid grid-cols-3 gap-2 border border-black bg-white p-3 font-mono text-left">
                <div>
                  <span className="text-[10px] text-neutral-600 uppercase block">CORE INSIGHT</span>
                  <strong className="text-xs uppercase text-black">Real ≠ True</strong>
                </div>
                <div className="border-l border-black pl-3">
                  <span className="text-[10px] text-neutral-600 uppercase block">DECOMPOSITION</span>
                  <strong className="text-xs uppercase text-black">4 Dimensions</strong>
                </div>
                <div className="border-l border-black pl-3">
                  <span className="text-[10px] text-neutral-600 uppercase block">REASONING</span>
                  <strong className="text-xs uppercase text-[#FF3B00]">Gemini 2.5 Flash</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Balanced Editorial Dossier & Pull-Quote (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between border-2 border-black bg-white p-6 space-y-6 font-mono text-left animate-fade-delayed">
            {/* Top Dossier Header with Barcode */}
            <div className="border-b-2 border-black pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest block">
                  INDEX // CASE REGISTRY
                </span>
                <span className="font-bold text-xs uppercase tracking-wider text-black">
                  DOSSIER #2026-CTX-09
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs font-black tracking-tighter">
                <span className="tracking-[2px]">||| | || |||| |</span>
              </div>
            </div>

            {/* Massive Editorial Serif Pull-Quote */}
            <div className="bg-[#F4F1EA] p-5 border border-black space-y-3">
              <span className="text-3xl font-serif font-black leading-none text-black">&ldquo;</span>
              <p className="font-serif text-xl sm:text-2xl font-bold text-black leading-snug -mt-2">
                When authentic media carries a forged narrative, pixels don&apos;t lie—the context does.
              </p>
              <div className="pt-2 border-t border-black/40 flex items-center justify-between text-[11px] font-mono text-neutral-700 font-bold uppercase">
                <span>&bull; FORENSIC OBSERVATION</span>
                <span>TEAM A² DISPATCH</span>
              </div>
            </div>

            {/* Structured Table of Contents / Forensic Matrix */}
            <div className="space-y-2 text-xs">
              <div className="border-b border-black pb-1 flex items-center justify-between font-bold uppercase text-neutral-600 text-[10px]">
                <span>VECTOR INDEX</span>
                <span>SURVEILLANCE STATUS</span>
              </div>

              <div className="p-2 border border-black bg-white flex items-center justify-between">
                <span className="font-bold">01 // TEMPORAL RECYCLING</span>
                <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-bold">DETECTED</span>
              </div>

              <div className="p-2 border border-black bg-white flex items-center justify-between">
                <span className="font-bold">02 // GEOGRAPHIC HIJACK</span>
                <span className="bg-[#FF3B00] text-black px-1.5 py-0.5 text-[10px] font-bold">FLAGGED</span>
              </div>

              <div className="p-2 border border-black bg-white flex items-center justify-between">
                <span className="font-bold">03 // ATOMIC DECOMPOSITION</span>
                <span className="border border-black bg-white text-black px-1.5 py-0.5 text-[10px] font-bold">ACTIVE</span>
              </div>
            </div>

            {/* Bottom Telemetry Stamp */}
            <div className="pt-3 border-t-2 border-black flex items-center justify-between text-[10px] font-mono font-bold text-black uppercase">
              <span className="flex items-center gap-1.5">
                <Terminal className="h-3 w-3 text-[#FF3B00]" />
                GROUNDING: GOOGLE SEARCH ONLINE
              </span>
              <span>VER: 2.5-FLASH</span>
            </div>
          </div>

          {/* Animated 2px Bottom Divider Line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black animate-draw-x-delayed" />
        </section>

        {/* Section: The Twist / Why Real vs Fake Classification Fails */}
        <section id="thesis" className="relative space-y-6 pt-4 pb-12">
          <div className="text-left max-w-3xl space-y-2">
            <div className="inline-block border border-black bg-[#FF3B00] text-black px-2 py-0.5 text-xs font-mono font-bold uppercase">
              THE FUNDAMENTAL TWIST
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-black uppercase text-black tracking-tight">
              Why Binary &ldquo;Real vs. Fake&rdquo; Detectors Fail
            </h2>
            <p className="font-mono text-xs sm:text-sm text-black leading-relaxed">
              Standard deepfake detectors look only at compression artifacts and neural synthesis signatures. When authentic footage from a 2021 typhoon in Japan is circulated as &ldquo;Mangalore flooding today&rdquo;, the video pixels are 100% genuine. Media detectors pass it with flying colors. The deception operates entirely in the context.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch font-mono">
            {/* Flawed Conventional Paradigm Box */}
            <div className="border-2 border-black bg-white p-6 flex flex-col justify-between text-left space-y-6">
              <div className="space-y-4">
                <div className="border-b-2 border-black pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-black">
                    <ShieldAlert className="h-5 w-5 text-black" />
                    <span className="font-bold text-xs uppercase tracking-wider">
                      CONVENTIONAL MEDIA DETECTOR
                    </span>
                  </div>
                  <span className="border border-black bg-[#FF3B00] px-2 py-0.5 text-[10px] font-bold text-black uppercase">
                    FATALLY BLIND
                  </span>
                </div>

                <div className="border border-black bg-[#F4F1EA] p-4 text-center space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-600 block">
                    BINARY CLASSIFICATION OUTPUT
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-serif text-black uppercase tracking-wider">
                    [ VERDICT: REAL ]
                  </div>
                  <p className="text-xs text-black border-t border-black pt-2 text-left">
                    <strong>Vulnerability:</strong> Pixel analysis reveals no generative artifacts. The detector validates the video as authentic, inadvertently legitimizing a completely false narrative.
                  </p>
                </div>
              </div>

              <div className="border-t border-black pt-4 space-y-2 text-xs">
                <strong className="uppercase text-black block">[ UNCHECKED VECTORS ]</strong>
                <ul className="space-y-1 text-black">
                  <li>&bull; Temporal Recycling: Old footage claimed as current event</li>
                  <li>&bull; Geographic Hijacking: Distant footage pinned to local areas</li>
                  <li>&bull; Narrative Inversion: Peace drill shown as live military strike</li>
                </ul>
              </div>
            </div>

            {/* The ContextLock Solution Box */}
            <div className="border-2 border-black bg-white p-6 flex flex-col justify-between text-left space-y-6">
              <div className="space-y-4">
                <div className="border-b-2 border-black pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-black">
                    <Split className="h-5 w-5 text-black" />
                    <span className="font-bold text-xs uppercase tracking-wider">
                      CONTEXTLOCK DECONSTRUCTION
                    </span>
                  </div>
                  <span className="border border-black bg-black text-white px-2 py-0.5 text-[10px] font-bold uppercase">
                    EVIDENCE-GROUNDED
                  </span>
                </div>

                {/* Sub-claim breakdown specimen */}
                <div className="border border-black bg-[#F4F1EA] p-4 space-y-3">
                  <div className="border-b border-black pb-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-600">INPUT CLAIM:</span>
                    <span className="font-bold text-black">&ldquo;Mangalore massive flooding today&rdquo;</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="border border-black bg-white p-2 flex items-center justify-between">
                      <span className="font-bold">WHAT: Massive Inundation</span>
                      <span className="border border-black bg-white text-black px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-black" /> SUPPORTED
                      </span>
                    </div>

                    <div className="border border-black bg-white p-2 flex items-center justify-between">
                      <span className="font-bold">WHERE: Mangalore (Kottara)</span>
                      <span className="border border-black bg-white text-black px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-black" /> SUPPORTED
                      </span>
                    </div>

                    <div className="border border-black bg-black text-white p-2 flex items-center justify-between">
                      <span className="font-bold text-[#FF3B00]">WHEN: Today (Current)</span>
                      <span className="border border-white bg-[#FF3B00] text-black px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-black" /> CONTRADICTED
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-black pt-2 flex items-center justify-between text-xs">
                    <span className="font-bold uppercase text-neutral-600">SYNTHESIS:</span>
                    <span className="font-bold uppercase bg-black text-[#FF3B00] px-2 py-0.5">
                      TEMPORAL MISMATCH (AUGUST 2023)
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-black pt-4 space-y-2 text-xs">
                <strong className="uppercase text-black block">[ THREE NUANCED STATES ]</strong>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="border border-black bg-white p-1.5 font-bold uppercase">
                    SUPPORTED
                  </div>
                  <div className="border border-black bg-[#FF3B00] text-black p-1.5 font-bold uppercase">
                    CONTRADICTED
                  </div>
                  <div className="border border-black bg-black text-white p-1.5 font-bold uppercase">
                    INSUFFICIENT
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Animated 2px Bottom Divider Line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black animate-draw-x-delayed" />
        </section>

        {/* Section: Architecture Pipeline */}
        <section className="space-y-6 pt-4">
          <div className="text-left max-w-3xl space-y-2">
            <div className="inline-block border border-black bg-black text-white px-2 py-0.5 text-xs font-mono font-bold uppercase">
              PIPELINE SPECIFICATION
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-black uppercase text-black tracking-tight">
              Investigative Engine Architecture
            </h2>
            <p className="font-mono text-xs sm:text-sm text-black leading-relaxed">
              ContextLock operates as an autonomous forensic laboratory. Every assertion is deconstructed into verified nodes linked to Google Search grounding citations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-left">
            {/* Step 1 */}
            <div className="border-2 border-black bg-white p-5 space-y-3 flex flex-col justify-between hover:bg-[#F4F1EA] transition-none">
              <div>
                <div className="border-b border-black pb-2 flex items-center justify-between">
                  <span className="text-lg font-black font-serif">[01]</span>
                  <FileSearch className="h-4 w-4 text-black" />
                </div>
                <h3 className="font-serif text-lg font-bold uppercase text-black mt-3">
                  Multimodal Clue Extraction
                </h3>
                <p className="text-xs text-black leading-relaxed mt-2">
                  Gemini analyzes raw media for environmental clues: license plates, language of street signboards, seasonal foliage, weather conditions, and architectural markers.
                </p>
              </div>
              <div className="text-[10px] font-bold uppercase border-t border-black pt-2 text-[#FF3B00]">
                MODALITY: IMAGE + VIDEO
              </div>
            </div>

            {/* Step 2 */}
            <div className="border-2 border-black bg-white p-5 space-y-3 flex flex-col justify-between hover:bg-[#F4F1EA] transition-none">
              <div>
                <div className="border-b border-black pb-2 flex items-center justify-between">
                  <span className="text-lg font-black font-serif">[02]</span>
                  <Layers className="h-4 w-4 text-black" />
                </div>
                <h3 className="font-serif text-lg font-bold uppercase text-black mt-3">
                  Atomic Claim Decomposition
                </h3>
                <p className="text-xs text-black leading-relaxed mt-2">
                  User statements are parsed into isolated WHAT, WHERE, WHEN, and WHO sub-claims using strict JSON schemas to avoid holistic bias.
                </p>
              </div>
              <div className="text-[10px] font-bold uppercase border-t border-black pt-2 text-black">
                SCHEMA: STRUCTURED OUTPUT
              </div>
            </div>

            {/* Step 3 */}
            <div className="border-2 border-black bg-white p-5 space-y-3 flex flex-col justify-between hover:bg-[#F4F1EA] transition-none">
              <div>
                <div className="border-b border-black pb-2 flex items-center justify-between">
                  <span className="text-lg font-black font-serif">[03]</span>
                  <Database className="h-4 w-4 text-black" />
                </div>
                <h3 className="font-serif text-lg font-bold uppercase text-black mt-3">
                  Google Search Grounding
                </h3>
                <p className="text-xs text-black leading-relaxed mt-2">
                  Retrieves live news logs, archival disaster reporting, and official weather metrics with verified timestamps and source URLs.
                </p>
              </div>
              <div className="text-[10px] font-bold uppercase border-t border-black pt-2 text-black">
                TOOL: SEARCH GROUNDING
              </div>
            </div>

            {/* Step 4 */}
            <div className="border-2 border-black bg-white p-5 space-y-3 flex flex-col justify-between hover:bg-[#F4F1EA] transition-none">
              <div>
                <div className="border-b border-black pb-2 flex items-center justify-between">
                  <span className="text-lg font-black font-serif">[04]</span>
                  <FileCheck2 className="h-4 w-4 text-black" />
                </div>
                <h3 className="font-serif text-lg font-bold uppercase text-black mt-3">
                  Traceable Audit Synthesis
                </h3>
                <p className="text-xs text-black leading-relaxed mt-2">
                  Constructs a definitive verdict (e.g. Temporal Mismatch, Geographic Mismatch) accompanied by cited evidence cards and confidence scores.
                </p>
              </div>
              <div className="text-[10px] font-bold uppercase border-t border-black pt-2 text-[#FF3B00]">
                OUTPUT: VERACITY REPORT
              </div>
            </div>
          </div>

          {/* Bottom CTA Strip */}
          <div className="border-2 border-black bg-black text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
            <div className="space-y-1 text-left">
              <span className="text-xs text-[#FF3B00] font-bold uppercase tracking-widest block">
                [ READY FOR VERIFICATION ]
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold uppercase text-white">
                Enter The Investigation Workspace
              </h3>
            </div>

            <Link
              href="/verify"
              className="inline-flex items-center gap-2 border-2 border-white bg-[#FF3B00] hover:bg-white text-black px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-none"
            >
              <span>Launch Verification</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}


