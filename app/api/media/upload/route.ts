import { NextRequest, NextResponse } from 'next/server';
import { processMediaUpload } from '@/lib/media/service';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const caseId = formData.get('caseId') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No media file provided.' }, { status: 400 });
    }

    const result = await processMediaUpload(file, caseId || undefined);

    return NextResponse.json({
      success: true,
      media: result,
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Media upload API error:', error);
    
    const message = error instanceof Error ? error.message : String(error);
    let status = 500;
    
    // Determine status and structure based on message
    if (message.includes('Unsupported file type')) status = 400;
    if (message.includes('exceeds')) {
      status = 413;
      if (message.includes('Video')) {
        return NextResponse.json({ 
          success: false, 
          error: 'VIDEO_TOO_LARGE', 
          message: 'Video exceeds the current 100 MB limit. Large-video preprocessing will allow ContextLock to analyze longer videos by extracting relevant frames, audio, and metadata.' 
        }, { status });
      }
    }
    
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
