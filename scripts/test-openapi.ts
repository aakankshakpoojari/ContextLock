export {};
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      "apikey": supabaseKey!,
      "Authorization": `Bearer ${supabaseKey!}`
    }
  });
  const data = await res.json();
  console.log(Object.keys(data.definitions || {}));
}
run();

