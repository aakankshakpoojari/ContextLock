import re

with open('app/verify/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const [result, setResult] = useState<VerificationResult | null>(null);', 'const [result, setResult] = useState<VerificationResult | null>(null);\n  const [verificationError, setVerificationError] = useState<string | null>(null);')

handle_verif = """  const handleVerification = async () => {
    if (!caseId || !mediaId) {
      console.error("Please upload media first");
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    setResult(null);

    const claim = {
      rawText: claimText,
      sourcePlatform,
      claimedDate,
      claimedLocation,
    };

    console.log("INVESTIGATE CLICKED");
    console.log("VERIFY PAYLOAD", { caseId, mediaId, claim });

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          mediaId,
          claim,
        }),
      });

      console.log("VERIFY RESPONSE", response.status);

      if (response.ok) {
        const data: VerificationResult = await response.json();
        setResult(data);
      } else {
        const errData = await response.json();
        console.error("Verification API failed with status:", response.status, errData);
        setVerificationError(errData.message || "Verification failed");
      }
    } catch (err) {
      console.error("Failed to query verification API:", err);
      setVerificationError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsVerifying(false);
    }
  };
"""

content = re.sub(r'  const handleVerification = async \(\) => \{.*?\};\n\n', handle_verif + '\n', content, flags=re.DOTALL)

button_text = """                  {isVerifying ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>ANALYZING MEDIA & CONTEXT...</span>
                    </>
                  ) : ("""
content = content.replace('                  {isVerifying ? (\n                    <>\n                      <RefreshCw className="h-4 w-4 animate-spin" />\n                      <span>DECONSTRUCTING CLAIMS...</span>\n                    </>\n                  ) : (', button_text)

error_ui = """          {/* Right Column: Verification Results (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {verificationError && (
              <div className="border-2 border-red-600 bg-red-50 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <h2 className="font-serif text-xl font-black uppercase text-red-600">
                    VERIFICATION FAILED
                  </h2>
                </div>
                <p className="text-sm text-red-800 font-mono">{verificationError}</p>
              </div>
            )}
            
            {result ? ("""
content = content.replace('          {/* Right Column: Verification Results (7 cols) */}\n          <div className="lg:col-span-7 space-y-6">\n            {result ? (', error_ui)

with open('app/verify/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
