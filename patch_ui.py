import re

with open('target_ui.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove INITIAL_DEMO_RESULT
content = re.sub(r'// Initial sample demonstration data.*?const INITIAL_DEMO_RESULT.*?};\n', '// Initial state is null\n', content, flags=re.DOTALL)

# 2. Fix state initialization
content = content.replace('useState(\n    "This video shows today\'s massive flooding in Mangalore."\n  )', 'useState("")')
content = content.replace('useState("WhatsApp Forward")', 'useState("")')
content = content.replace('useState("Mangalore, Karnataka")', 'useState("")')
content = content.replace('useState("Today")', 'useState("")')
content = content.replace('useState<string | null>(\n    "mangalore_flood_forward.mp4"\n  )', 'useState<string | null>(null)')
content = content.replace('useState<VerificationResult | null>(INITIAL_DEMO_RESULT)', 'useState<VerificationResult | null>(null)')

# 3. Fix handleFileUpload
handle_file_upload_replacement = """  const handleFileUpload = async (file: File) => {
    if (file.type.startsWith("video/") && file.size > 100 * 1024 * 1024) {
      setUploadError(
        "Video exceeds the current 100 MB limit. Large-video preprocessing will allow ContextLock to analyze longer videos by extracting relevant frames, audio, and metadata."
      );
      return;
    }

    setSelectedFileName(file.name);"""
content = content.replace('  const handleFileUpload = async (file: File) => {\n    setSelectedFileName(file.name);', handle_file_upload_replacement)

# 4. Replace handleSimulateVerification with handleVerification
handle_sim_ver_start = content.find('  const handleSimulateVerification = async () => {')
handle_sim_ver_end = content.find('  return (', handle_sim_ver_start)

handle_verification = """  const handleVerification = async () => {
    if (!caseId || !mediaId) {
      console.error("Please upload media first");
      return;
    }

    setIsVerifying(true);

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
        console.error("Verification API failed with status:", response.status);
      }
    } catch (err) {
      console.error("Failed to query verification API:", err);
    } finally {
      setIsVerifying(false);
    }
  };

"""
content = content[:handle_sim_ver_start] + handle_verification + content[handle_sim_ver_end:]

# 5. Fix onClick and reset buttons
content = content.replace('onClick={handleSimulateVerification}', 'onClick={handleVerification}')
# Remove the reset button
content = re.sub(r'<button\s+onClick=\{\(\) => setResult\(INITIAL_DEMO_RESULT\)\}.*?</button>', '', content, flags=re.DOTALL)

with open('app/verify/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
