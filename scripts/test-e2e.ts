import { getSupabaseClient } from "../lib/supabase";

async function run() {
  const supabase = getSupabaseClient();
  const { data: mediaRecord } = await supabase.from("media").select("*").limit(1).single();
  
  if (!mediaRecord) {
    console.error("No media records found in database.");
    process.exit(1);
  }
  
  console.log("Found media:", mediaRecord.id, "Case:", mediaRecord.case_id);
  
  const payload = {
    caseId: mediaRecord.case_id,
    mediaId: mediaRecord.id,
    claim: {
      rawText: "This video shows the flooding in Mangalore today.",
      claimedLocation: "Mangalore",
      claimedDate: "today"
    }
  };
  
  console.log("Sending payload:", payload);
  const response = await fetch("http://localhost:3000/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  console.log("Response Status:", response.status);
  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
}
run();
