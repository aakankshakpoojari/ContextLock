import { ProcessedVideo } from "./types";
import { MAX_VIDEO_SIZE } from "../media/validation";

/**
 * Validates whether a video size is within the acceptable MVP limits.
 * Currently returns false for videos strictly > 100MB.
 */
export function validateVideoSize(size: number): boolean {
  return size <= MAX_VIDEO_SIZE;
}

/**
 * Extract video metadata.
 * TODO: implement with a video processing backend (e.g., FFmpeg/ffprobe).
 */
export async function getVideoMetadata(file: File | string): Promise<ProcessedVideo["metadata"]> {
  throw new Error("Video metadata extraction is not implemented yet.");
}

/**
 * Extract representative frames based on duration, scene changes, and claim relevance.
 * Strategy:
 * - Short video -> more frequent sampling
 * - Long video -> fewer representative samples
 * - Scene changes -> prioritize changed scenes
 * - Claim-relevant timestamps -> prioritize
 * 
 * TODO: implement frame extraction with a video processing backend.
 */
export async function extractRepresentativeFrames(file: File | string): Promise<ProcessedVideo["frames"]> {
  throw new Error("Video frame extraction is not implemented yet.");
}

/**
 * Extract audio track from video.
 * TODO: implement audio extraction with a video processing backend.
 */
export async function extractAudio(file: File | string): Promise<boolean> {
  throw new Error("Audio extraction is not implemented yet.");
}

/**
 * Create video chunks for processing large files.
 * TODO: implement video chunking with a video processing backend.
 */
export async function createVideoChunks(file: File | string): Promise<void> {
  throw new Error("Video chunking is not implemented yet.");
}
