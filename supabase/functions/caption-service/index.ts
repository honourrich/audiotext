/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

/**
 * YouTube Caption Extraction Service
 * 
 * This service provides modular caption extraction from YouTube videos
 * using the youtube-caption-extractor package.
 * 
 * Features:
 * - Extract captions from any YouTube video with captions enabled
 * - Support multiple languages (auto-detect or specify)
 * - Returns structured data with timestamps
 * - Preserves youtube-caption-extractor functionality
 */

interface CaptionSegment {
  text: string;
  offset: number; // in milliseconds
  duration: number; // in seconds
}

interface CaptionServiceOptions {
  videoId: string;
  lang?: string;
}

interface CaptionServiceResult {
  success: boolean;
  captions?: CaptionSegment[];
  error?: string;
}

/**
 * Extract captions from YouTube video
 * This function wraps the youtube-caption-extractor package to provide
 * a clean, modular service interface
 */
export async function extractYouTubeCaptions(
  options: CaptionServiceOptions
): Promise<CaptionServiceResult> {
  const { videoId, lang = 'en' } = options;

  try {
    console.log(`[Caption Service] Extracting captions for video: ${videoId}, language: ${lang}`);
    
    // Import the youtube-caption-extractor package
    const { getSubtitles } = await import('https://esm.sh/youtube-caption-extractor@1.9.0');
    
    console.log('[Caption Service] Package imported successfully, extracting captions...');
    
    // Extract captions using the package
    const subtitles = await getSubtitles({ 
      videoID: videoId, 
      lang 
    });
    
    if (!subtitles || subtitles.length === 0) {
      // Try auto-detection if specific language failed
      if (lang !== 'auto') {
        console.log('[Caption Service] No captions found for specified language, trying auto-detection...');
        return await extractYouTubeCaptions({ videoId, lang: 'auto' });
      }
      
      throw new Error('No captions available for this video. The video may not have captions enabled or they may be in a different language.');
    }
    
    console.log(`[Caption Service] Package extracted ${subtitles.length} caption segments`);
    
    // Convert to our standardized format
    const captions: CaptionSegment[] = subtitles.map((subtitle: any) => ({
      text: subtitle.text.trim(),
      offset: Math.floor(parseFloat(subtitle.start) * 1000), // Convert to milliseconds
      duration: parseFloat(subtitle.dur) || 5 // Default to 5 seconds if no duration
    }));
    
    console.log(`[Caption Service] ✅ Successfully converted ${captions.length} caption segments`);
    
    return {
      success: true,
      captions
    };
    
  } catch (error) {
    console.error('[Caption Service] Error extracting captions:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Determine specific error type
    if (errorMessage.includes('No captions')) {
      return {
        success: false,
        error: 'This video does not have captions available. Please try a video with captions enabled.'
      };
    }
    
    if (errorMessage.includes('unavailable') || errorMessage.includes('private')) {
      return {
        success: false,
        error: 'Video is unavailable or private'
      };
    }
    
    return {
      success: false,
      error: `Failed to extract captions: ${errorMessage}`
    };
  }
}

/**
 * Calculate video duration from captions
 * This estimates the video length based on the last caption's timestamp
 */
export function estimateDurationFromCaptions(captions: CaptionSegment[]): number {
  if (!captions || captions.length === 0) {
    return 0;
  }
  
  const lastCaption = captions[captions.length - 1];
  
  // Calculate duration from last caption's end time
  // offset is in milliseconds, duration is in seconds
  const lastCaptionEndTime = (lastCaption.offset / 1000) + lastCaption.duration;
  
  // Round up to the nearest second
  const estimatedDuration = Math.ceil(lastCaptionEndTime);
  
  console.log(`[Caption Service] Estimated duration: ${estimatedDuration} seconds (${Math.floor(estimatedDuration / 60)}:${(estimatedDuration % 60).toString().padStart(2, '0')})`);
  
  return estimatedDuration;
}

// Export service metadata
export const CaptionService = {
  name: 'YouTube Caption Extraction Service',
  version: '1.0.0',
  extractYouTubeCaptions,
  estimateDurationFromCaptions
};

