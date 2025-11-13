/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

/**
 * YouTube Data API v3 Service
 * 
 * This service provides access to YouTube's official Data API v3
 * to fetch video metadata including duration, title, and description.
 * 
 * Features:
 * - Fetch video metadata using official YouTube Data API v3
 * - Extract duration, title, and description
 * - Parse ISO 8601 duration format
 * - Handle API errors gracefully
 * - Designed to run before or parallel to caption extraction
 */

interface YouTubeVideoMetadata {
  videoId: string;
  title: string;
  description: string;
  duration: number; // in seconds
  publishedAt?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
}

interface YouTubeApiResponse {
  success: boolean;
  metadata?: YouTubeVideoMetadata;
  error?: string;
}

interface YouTubeApiOptions {
  videoId: string;
  apiKey: string;
}

/**
 * Parse YouTube duration format (PT4M13S -> seconds)
 * Handles ISO 8601 duration format from YouTube Data API
 */
function parseYouTubeDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  console.log(`[YouTube API] Duration parsing - Input: ${duration}, Parsed: ${hours}h ${minutes}m ${seconds}s`);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch video metadata from YouTube Data API v3 with retry logic
 * 
 * @param options - Configuration object with videoId and apiKey
 * @param retryCount - Current retry attempt (default: 0)
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise<YouTubeApiResponse> - Structured response with metadata or error
 */
export async function fetchYouTubeVideoMetadata(
  options: YouTubeApiOptions,
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<YouTubeApiResponse> {
  const { videoId, apiKey } = options;

  try {
    console.log(`[YouTube API] Fetching metadata for video: ${videoId} (Attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Construct the API URL
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails,snippet&key=${apiKey}`;
    
    console.log(`[YouTube API] Making request to: ${apiUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
    
    // Make the API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AudioText/1.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[YouTube API] HTTP Error ${response.status}: ${errorText}`);
      
      // Retry logic for certain error codes
      if (response.status === 429 || response.status === 500 || response.status === 503) {
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`[YouTube API] Retrying after ${delay}ms due to status ${response.status}`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchYouTubeVideoMetadata(options, retryCount + 1, maxRetries);
        }
      }
      
      if (response.status === 403) {
        console.error(`[YouTube API] ❌ Quota exceeded or API key invalid`);
        return {
          success: false,
          error: 'YouTube API quota exceeded or API key invalid'
        };
      }
      
      if (response.status === 404) {
        return {
          success: false,
          error: 'Video not found or private'
        };
      }
      
      return {
        success: false,
        error: `YouTube API error: ${response.status} ${response.statusText}`
      };
    }
    
    const data = await response.json();
    console.log(`[YouTube API] Response received:`, JSON.stringify(data, null, 2));
    
    // Check if video exists
    if (!data.items || data.items.length === 0) {
      return {
        success: false,
        error: 'Video not found or private'
      };
    }
    
    const video = data.items[0];
    
    // Extract metadata
    const metadata: YouTubeVideoMetadata = {
      videoId,
      title: video.snippet?.title || `YouTube Video ${videoId}`,
      description: video.snippet?.description || '',
      duration: parseYouTubeDuration(video.contentDetails?.duration || 'PT0S'),
      publishedAt: video.snippet?.publishedAt,
      channelTitle: video.snippet?.channelTitle,
      thumbnailUrl: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.default?.url
    };
    
    console.log(`[YouTube API] ✅ Successfully extracted metadata:`);
    console.log(`[YouTube API] - Title: ${metadata.title}`);
    console.log(`[YouTube API] - Duration: ${metadata.duration} seconds (${Math.floor(metadata.duration / 60)}:${(metadata.duration % 60).toString().padStart(2, '0')})`);
    console.log(`[YouTube API] - Channel: ${metadata.channelTitle}`);
    console.log(`[YouTube API] - Description length: ${metadata.description.length} characters`);
    
    return {
      success: true,
      metadata
    };
    
  } catch (error) {
    console.error('[YouTube API] Error fetching video metadata:', error);
    
    // Handle specific error types
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[YouTube API] Request timeout');
      
      // Retry on timeout if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[YouTube API] Retrying after ${delay}ms due to timeout`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchYouTubeVideoMetadata(options, retryCount + 1, maxRetries);
      }
      
      return {
        success: false,
        error: 'Request timeout - YouTube API did not respond in time'
      };
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[YouTube API] Network error');
      
      // Retry on network errors if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[YouTube API] Retrying after ${delay}ms due to network error`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchYouTubeVideoMetadata(options, retryCount + 1, maxRetries);
      }
      
      return {
        success: false,
        error: 'Network error - Unable to reach YouTube API'
      };
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      error: `Failed to fetch video metadata: ${errorMessage}`
    };
  }
}

/**
 * Fetch video metadata with automatic API key from environment
 * 
 * @param videoId - YouTube video ID
 * @returns Promise<YouTubeApiResponse> - Structured response with metadata or error
 */
export async function fetchYouTubeVideoMetadataAuto(videoId: string): Promise<YouTubeApiResponse> {
  const apiKey = Deno.env.get('YOUTUBE_API_KEY');
  
  if (!apiKey) {
    console.log('[YouTube API] YOUTUBE_API_KEY not configured');
    return {
      success: false,
      error: 'YouTube API key not configured'
    };
  }
  
  return await fetchYouTubeVideoMetadata({ videoId, apiKey });
}

/**
 * Batch fetch metadata for multiple videos
 * 
 * @param videoIds - Array of YouTube video IDs
 * @param apiKey - YouTube API key
 * @returns Promise<YouTubeApiResponse[]> - Array of responses
 */
export async function fetchMultipleVideoMetadata(
  videoIds: string[],
  apiKey: string
): Promise<YouTubeApiResponse[]> {
  console.log(`[YouTube API] Batch fetching metadata for ${videoIds.length} videos`);
  
  const promises = videoIds.map(videoId => 
    fetchYouTubeVideoMetadata({ videoId, apiKey })
  );
  
  const results = await Promise.allSettled(promises);
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`[YouTube API] Error fetching metadata for video ${videoIds[index]}:`, result.reason);
      return {
        success: false,
        error: `Failed to fetch metadata: ${result.reason}`
      };
    }
  });
}

// Export service metadata
export const YouTubeDataApiService = {
  name: 'YouTube Data API v3 Service',
  version: '1.0.0',
  fetchYouTubeVideoMetadata,
  fetchYouTubeVideoMetadataAuto,
  fetchMultipleVideoMetadata,
  parseYouTubeDuration
};

// Export types for use in other modules
export type { YouTubeVideoMetadata, YouTubeApiResponse, YouTubeApiOptions };
