export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  frameRate: number;
  bitrate: number;
  codec: string;
}

export async function extractVideoMetadata(videoFile: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(videoFile);
    
    video.onloadedmetadata = () => {
      const metadata: VideoMetadata = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
        frameRate: 30, // Default, would need more complex extraction for actual frame rate
        bitrate: 0, // Would need more complex extraction
        codec: 'unknown' // Would need more complex extraction
      };
      
      URL.revokeObjectURL(url);
      resolve(metadata);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = url;
    video.load();
  });
}

export function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  const ratioWidth = width / divisor;
  const ratioHeight = height / divisor;
  return `${ratioWidth}:${ratioHeight}`;
}

export function isVerticalVideo(width: number, height: number): boolean {
  return height > width;
}

export function isHorizontalVideo(width: number, height: number): boolean {
  return width > height;
}

export function isSquareVideo(width: number, height: number): boolean {
  return width === height;
}
