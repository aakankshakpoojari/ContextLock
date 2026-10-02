import Link from "next/link";
import { ShieldCheck, Search, ArrowRight } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-[#F4F1EA]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left-Aligned Brand / Masthead */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center border-2 border-black bg-black text-white group-hover:bg-[#FF3B00] group-hover:text-black transition-none">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-serif text-2xl font-bold tracking-tight text-black leading-none uppercase">
              Context<span className="font-sans font-black tracking-normal">Lock</span>
            </span>
            <span className="text-[10px] tracking-widest uppercase text-black font-mono font-bold mt-0.5">
              [DISPATCH // MEDIA CONTEXT VERIFICATION]
            </span>
          </div>
        </Link>

        
        {/* Navigation Actions */}
        <nav className="flex items-center gap-3 font-mono">
          <Link
            href="/"
            className="text-xs uppercase font-bold tracking-wider text-black hover:bg-black hover:text-white px-3 py-2 border border-black transition-none hidden sm:inline-block"
          >
            Thesis
          </Link>
          <Link
            href="/verify"
            className="inline-flex items-center gap-2 border-2 border-black bg-black hover:bg-[#FF3B00] text-white hover:text-black px-4 py-2 text-xs font-bold uppercase tracking-wider transition-none"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Verify Media</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

