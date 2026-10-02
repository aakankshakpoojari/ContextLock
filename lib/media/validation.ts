export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

export function validateMediaFile(file: File): { valid: boolean; error?: string; type?: 'image' | 'video' } {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return { valid: false, error: 'Unsupported file type. Please upload a valid image (JPG, PNG, WEBP) or video (MP4, MOV, WEBM).' };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'Image file size exceeds the 10MB limit.' };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: 'Video file size exceeds the 100MB limit.' };
  }

  return { valid: true, type: isImage ? 'image' : 'video' };
}
