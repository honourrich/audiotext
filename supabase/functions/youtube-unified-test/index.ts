/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

/**
 * YouTube Unified Service - Test Version
 * 
 * Simplified version for testing without external API dependencies
 */

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface YouTubeUnifiedRequest {
  url: string;
  lang?: string;
}

interface YouTubeUnifiedResponse {
  success: boolean;
  videoId?: string;
  metadata?: {
    title: string;
    description: string;
    duration: number;
    publishedAt?: string;
    channelTitle?: string;
    thumbnailUrl?: string;
  };
  transcript?: string;
  error?: string;
  processingTime?: number;
}

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight - CRITICAL: Always return OK with CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    console.log('[Test Service] YouTube unified processing request received');
    console.log('[Test Service] Request method:', req.method);
    console.log('[Test Service] Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Safely parse request body
    let body: YouTubeUnifiedRequest;
    try {
      const rawBody = await req.text();
      console.log('[Test Service] Raw request body:', rawBody);
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (parseError) {
      console.error('[Test Service] Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request body format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { url, lang = 'en' } = body;
    
    if (!url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'YouTube URL is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate YouTube URL format
    const videoId = extractVideoId(url);
    if (!videoId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid YouTube URL format. Please provide a valid YouTube video URL.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[Test Service] Processing YouTube video: ${videoId}`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return test data
    const result: YouTubeUnifiedResponse = {
      success: true,
      videoId,
      metadata: {
        title: `Test YouTube Video ${videoId}`,
        description: 'This is a test video for development purposes',
        duration: 300, // 5 minutes
        publishedAt: '2024-01-01T00:00:00Z',
        channelTitle: 'Test Channel',
        thumbnailUrl: 'https://via.placeholder.com/320x180'
      },
      transcript: 'This is a test transcript for the YouTube video. It contains sample text that would normally be extracted from YouTube captions. This allows us to test the episode creation functionality without needing the actual Supabase functions to be deployed.',
      processingTime: 1000
    };

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[Test Service] Request processing error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Request processing failed: ${errorMessage}`,
        processingTime: 0
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

