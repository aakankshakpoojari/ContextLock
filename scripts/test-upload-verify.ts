export {};
async function run() {
  const dummyFile = new Blob(["dummy image data"], { type: "image/jpeg" });
  const formData = new FormData();
  formData.append("file", dummyFile, "dummy.jpg");
  
  console.log("Uploading media...");
  const uploadRes = await fetch("http://localhost:3000/api/media/upload", {
    method: "POST",
    body: formData
  });
  const uploadJson = await uploadRes.json();
  console.log("Upload result:", uploadJson);
  
  if (!uploadJson.mediaId) {
    console.error("Upload failed");
    return;
  }
  
  const payload = {
    caseId: uploadJson.caseId,
    mediaId: uploadJson.mediaId,
    claim: {
      rawText: "This video shows the flooding in Mangalore today.",
      claimedLocation: "Mangalore",
      claimedDate: "today"
    }
  };
  
  console.log("Sending verify payload:", payload);
  const response = await fetch("http://localhost:3000/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  console.log("Verify Status:", response.status);
  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
}
run();

