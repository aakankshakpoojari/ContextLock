import { getSupabaseClient } from '../supabase';
import { uploadMediaToStorage, deleteMediaFromStorage } from './storage';
import { validateMediaFile } from './validation';
import { randomUUID } from 'crypto';

export async function processMediaUpload(file: File, existingCaseId?: string) {
  const supabase = getSupabaseClient();
  
  // 1. Validate the file
  const validation = validateMediaFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const mediaType = validation.type!;
  let caseId = existingCaseId;

  // 2. Create or identify the verification case
  if (!caseId) {
    const { data: caseData, error: caseError } = await supabase
      .from('verification_cases')
      .insert({ original_claim: '', status: 'pending' })
      .select('id')
      .single();

    if (caseError || !caseData) {
      console.error('Failed to create verification case:', JSON.stringify(caseError, null, 2));
      throw new Error(`Failed to create verification case: ${JSON.stringify(caseError)}`);
    }
    caseId = caseData.id;
  }

  // 3. Generate a safe media ID for the storage path
  const mediaId = randomUUID();

  // 4. Upload to Storage
  const { path: storagePath, error: uploadError } = await uploadMediaToStorage(file, caseId as string, mediaId);
  
  if (uploadError) {
    throw new Error('Failed to upload media to storage.');
  }

  // 5. Insert Media Record
  const { data: mediaData, error: mediaError } = await supabase
    .from('media')
    .insert({
      id: mediaId,
      case_id: caseId,
      type: mediaType,
      storage_path: storagePath,
      mime_type: file.type,
      metadata: {
        originalName: file.name,
        size: file.size,
      },
    })
    .select('*')
    .single();

  if (mediaError || !mediaData) {
    console.error('Failed to insert media record:', mediaError);
    // Cleanup storage to prevent orphans
    await deleteMediaFromStorage(storagePath);
    throw new Error('Failed to create media database record.');
  }

  return {
    id: mediaData.id,
    caseId: mediaData.case_id,
    mediaType: mediaData.type,
    mimeType: mediaData.mime_type,
    storagePath: mediaData.storage_path,
  };
}
