import { getSupabaseClient } from '../supabase';

export const MEDIA_BUCKET_NAME = 'contextlock-media';

export async function uploadMediaToStorage(
  file: File,
  caseId: string,
  mediaId: string
): Promise<{ path: string; error: string | null }> {
  const supabase = getSupabaseClient();
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  // Ensure the filename is safe and unique
  const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  // Storage path: verification-cases/{caseId}/{mediaId}/{safeFileName}
  const storagePath = `verification-cases/${caseId}/${mediaId}/${safeFileName}`;

  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET_NAME)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Storage upload error:', error);
    return { path: '', error: error.message };
  }

  return { path: data.path, error: null };
}

export async function deleteMediaFromStorage(path: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET_NAME)
    .remove([path]);
    
  if (error) {
    console.error('Failed to delete media from storage:', error);
    return false;
  }
  return true;
}
