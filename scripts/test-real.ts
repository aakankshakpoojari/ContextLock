import fs from 'fs';
import { File } from 'buffer';

async function run() {
  try {
    const filePath = 'node_modules/.pnpm/@supabase+phoenix@0.4.5/node_modules/@supabase/phoenix/priv/static/phoenix-orange.png';
    const buffer = fs.readFileSync(filePath);
    const file = new File([buffer], 'phoenix-orange.png', { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('file', file as unknown as Blob);
    
    console.log('Uploading media...');
    const uploadRes = await fetch('http://127.0.0.1:3000/api/media/upload', {
      method: 'POST',
      body: formData
    });
    
    console.log('Upload HTTP status:', uploadRes.status);
    const uploadJson = await uploadRes.json();
    console.log('Upload result:', uploadJson);
    
    if (!uploadJson.media || !uploadJson.media.id) {
      console.error('Upload failed');
      return;
    }
    
    const payload = {
      caseId: uploadJson.media.caseId,
      mediaId: uploadJson.media.id,
      claim: {
        rawText: 'This image shows flooding in Mangalore today.',
        claimedLocation: 'Mangalore',
        claimedDate: 'today'
      }
    };
    
    console.log('Sending verify payload...');
    const response = await fetch('http://127.0.0.1:3000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log('Verify HTTP Status:', response.status);
    const json = await response.json();
    console.log('Verify Response:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
