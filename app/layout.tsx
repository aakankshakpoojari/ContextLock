import type { Metadata } from "next";
import { DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const serifFont = DM_Serif_Display({
  weight: "400",
  variable: "--font-serif",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  weight: ["400", "500", "700", "800"],
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ContextLock — Editorial Media Context Verification",
  description:
    "Verify the context, not just the content. Real media can carry false context. ContextLock uses Google Gemini to investigate claims attached to images and videos and connect them to evidence.",
  keywords: [
    "ContextLock",
    "Gemini Hack Days 2026",
    "Trust in a Synthetic World",
    "Media Verification",
    "Misinformation",
    "Fact-checking",
    "Multimodal AI",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${serifFont.variable} ${monoFont.variable} font-mono antialiased bg-[#F4F1EA] text-black flex flex-col min-h-screen selection:bg-black selection:text-[#F4F1EA]`}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

