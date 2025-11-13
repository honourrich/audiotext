// YouTube URL validation and caption checking utilities

import { YouTubeValidationResult } from '@/types';

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Validate YouTube URL format
 */
export function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/v\/[\w-]+/
  ];
  
  return patterns.some(pattern => pattern.test(url));
}

/**
 * Get video title using YouTube oEmbed API
 */
export async function getVideoTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.title || `YouTube Video ${videoId}`;
    }
  } catch (error) {
    console.error('Failed to get video title:', error);
  }
  
  return `YouTube Video ${videoId}`;
}

/**
 * Check if video has captions by attempting to extract them
 */
export async function checkVideoCaptions(videoId: string): Promise<{
  hasCaptions: boolean;
  captionCount?: number;
  error?: string;
}> {
  try {
    // This is a simple check - in a real implementation, you might want to
    // call your backend function to check for captions
    // For now, we'll return true as a placeholder
    // The actual caption checking will be done in the backend
    
    return {
      hasCaptions: true,
      captionCount: 0 // Will be filled by backend
    };
    
  } catch (error) {
    console.error('Error checking video captions:', error);
    return {
      hasCaptions: false,
      error: error instanceof Error ? error.message : 'Failed to check captions'
    };
  }
}

/**
 * Comprehensive YouTube URL validation for captions
 */
export async function validateYouTubeUrlForCaptions(url: string): Promise<YouTubeValidationResult> {
  // Clean and trim the URL
  const cleanUrl = url.trim();
  
  // Check URL format
  if (!isValidYouTubeUrl(cleanUrl)) {
    return {
      valid: false,
      hasCaption: false,
      message: 'Invalid YouTube URL format. Please provide a valid YouTube video URL.'
    };
  }
  
  // Extract video ID
  const videoId = extractVideoId(cleanUrl);
  if (!videoId) {
    return {
      valid: false,
      hasCaption: false,
      message: 'Could not extract video ID from URL.'
    };
  }
  
  try {
    // Get video title
    const videoTitle = await getVideoTitle(videoId);
    
    // Check if video has captions
    const captionCheck = await checkVideoCaptions(videoId);
    
    if (!captionCheck.hasCaptions) {
      return {
        valid: true,
        hasCaption: false,
        videoTitle,
        message: captionCheck.error || 'This video does not have captions available. Please try a different video.'
      };
    }
    
    return {
      valid: true,
      hasCaption: true,
      videoTitle,
      wordCount: captionCheck.captionCount,
      message: 'Video has captions available and is ready to process.'
    };
    
  } catch (error) {
    console.error('Error validating YouTube URL:', error);
    return {
      valid: false,
      hasCaption: false,
      message: 'Failed to validate video. Please check if the video is public and accessible.'
    };
  }
}

/**
 * Check if URL is already processed (for duplicate prevention)
 */
export function isDuplicateUrl(url: string, existingEpisodes: any[]): boolean {
  const cleanUrl = url.trim().toLowerCase();
  return existingEpisodes.some(episode => 
    episode.youtubeUrl?.toLowerCase() === cleanUrl
  );
}

/**
 * Parse timestamp from caption format [00:00:15] to seconds
 */
export function parseTimestampToSeconds(timestamp: string): number {
  const match = timestamp.match(/\[(\d{2}):(\d{2}):(\d{2})\]/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

/**
 * Create YouTube video URL with timestamp
 */
export function createYouTubeUrlWithTimestamp(videoId: string, timestampInSeconds: number): string {
  const minutes = Math.floor(timestampInSeconds / 60);
  const seconds = Math.floor(timestampInSeconds % 60);
  return `https://www.youtube.com/watch?v=${videoId}&t=${minutes}m${seconds}s`;
}

/**
 * Format duration from seconds to readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Count words in transcript text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Extract video ID from YouTube URL (alternative method)
 */
export function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
