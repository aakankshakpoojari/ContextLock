export {};
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweiJ9.invalid";

const supabase = createClient(supabaseUrl!, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('media').select('*').limit(1);
  console.log("Error with fake key:", error);
}
run();

