import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  const t1 = await supabase.from('evidence_relationships').select('*').limit(1);
  console.log('evidence_relationships:', t1.error ? t1.error.code : 'EXISTS!');
  
  const t2 = await supabase.from('verification_results').select('*').limit(1);
  console.log('verification_results:', t2.error ? t2.error.code : 'EXISTS!');
}
check();
