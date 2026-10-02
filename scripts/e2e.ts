import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

async function run() {
  const r = await supabase.from('media').select('id, case_id').limit(1).order('created_at', { ascending: false });
  console.log(JSON.stringify(r.data, null, 2));

  if (r.data && r.data.length > 0) {
    const { id, case_id } = r.data[0];
    const res = await fetch('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        caseId: case_id,
        mediaId: id,
        claim: { rawText: 'Flooding in Mangalore today' }
      })
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  }
}
run().catch(console.error);
