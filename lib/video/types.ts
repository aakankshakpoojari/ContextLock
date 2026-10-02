export type ProcessedVideo = {
  originalSize: number;
  duration?: number;
  mimeType: string;
  metadata?: {
    width?: number;
    height?: number;
    fps?: number;
  };
  frames?: {
    timestamp: number;
    url?: string;
  }[];
  audioAvailable?: boolean;
};
