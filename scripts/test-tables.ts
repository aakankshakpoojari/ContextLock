import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const tables = ["verification_cases", "VerificationCases", "cases", "verification_case", "media", "Media", "atomic_claims", "evidence"];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      console.log(`Table ${table} EXISTS!`);
    } else {
      console.log(`Table ${table}: ${error.code}`);
    }
  }
}
run();
