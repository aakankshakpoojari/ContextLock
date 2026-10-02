import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

const caseId = '5a7845d2-ee84-4ad4-9be0-28636749fa92';
const mediaId = '203f7428-94ea-440a-ac18-688b9a4e6b3b';
const storagePath = 'verification-cases/5a7845d2-ee84-4ad4-9be0-28636749fa92/203f7428-94ea-440a-ac18-688b9a4e6b3b/1790837895483_kkkifg.png';

async function verifyRows() {
  const c = await supabase.from('verification_cases').select('*').eq('id', caseId).single();
  console.log('verification_cases row:', c.data ? 'EXISTS' : c.error);
  
  const m = await supabase.from('media').select('*').eq('id', mediaId).single();
  console.log('media row:', m.data ? 'EXISTS' : m.error);
  
  // Actually download the file
  const file = await supabase.storage.from('contextlock-media').download(storagePath);
  console.log('storage object:', file.data ? 'EXISTS (' + file.data.size + ' bytes)' : file.error);
}
verifyRows();
