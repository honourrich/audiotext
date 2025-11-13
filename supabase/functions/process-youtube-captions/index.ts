/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
/// <reference types="https://deno.land/x/types/index.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { extractYouTubeCaptions as extractCaptionsService, estimateDurationFromCaptions } from '../caption-service/index.ts';
import { fetchYouTubeVideoMetadataAuto, YouTubeVideoMetadata } from '../youtube-data-api/index.ts';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface YouTubeRequest {
  youtubeUrl: string;
  userId: string;
}

interface CaptionSegment {
  text: string;
  duration: number;
  offset: number;
}

interface GeneratedContent {
  title: string;
  summary: string;
  takeaways: string[];
  topics: string[];
  cta: string;
}

interface YouTubeResponse {
  success: boolean;
  episodeId?: string;
  transcript?: string;
  generatedContent?: GeneratedContent;
  videoTitle?: string;
  videoDescription?: string;
  videoDuration?: number;
  message?: string;
  error?: string;
}

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Get video metadata using YouTube Data API v3
async function getVideoMetadata(videoId: string): Promise<{title: string, duration?: number, description?: string}> {
  console.log(`[Main Function] Fetching metadata for video: ${videoId}`);
  
  const result = await fetchYouTubeVideoMetadataAuto(videoId);
  
  if (result.success && result.metadata) {
    const metadata = result.metadata;
    console.log(`[Main Function] ✅ Successfully fetched metadata from YouTube Data API`);
    console.log(`[Main Function] - Title: ${metadata.title}`);
    console.log(`[Main Function] - Duration: ${metadata.duration} seconds`);
    console.log(`[Main Function] - Description: ${metadata.description.substring(0, 100)}...`);
    
    return {
      title: metadata.title,
      duration: metadata.duration,
      description: metadata.description
    };
  } else {
    console.log(`[Main Function] ⚠️ YouTube Data API failed: ${result.error}`);
    console.log(`[Main Function] Falling back to oEmbed API for title only`);
    
    // Fallback to oEmbed for title only
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      if (response.ok) {
        const data = await response.json();
        return {
          title: data.title || `YouTube Video ${videoId}`,
          duration: undefined, // oEmbed doesn't provide duration
          description: undefined
        };
      }
    } catch (error) {
      console.error('[Main Function] oEmbed fallback failed:', error);
    }
    
    return {
      title: `YouTube Video ${videoId}`,
      duration: undefined,
      description: undefined
    };
  }
}

// Extract captions using the modular caption service
async function extractCaptions(videoId: string): Promise<CaptionSegment[]> {
  console.log(`[Main Function] Extracting captions for video: ${videoId}`);
  
  const result = await extractCaptionsService({
    videoId,
    lang: 'en'
  });
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to extract captions');
  }
  
  if (!result.captions || result.captions.length === 0) {
    throw new Error('No captions available for this video');
  }
  
  console.log(`[Main Function] ✅ Successfully extracted ${result.captions.length} caption segments`);
  
  return result.captions;
}

// Generate content using OpenAI GPT-3.5-turbo (optimized for cost)
async function generateContent(transcript: string, videoTitle: string): Promise<GeneratedContent> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  const prompt = `You are an expert podcast content creator and marketing strategist. Analyze this YouTube video transcript and create detailed, specific show notes that capture the actual content and value.

Video Title: ${videoTitle}

Transcript:
${transcript}

IMPORTANT INSTRUCTIONS:
- Read the ENTIRE transcript carefully
- Extract specific details, examples, and insights mentioned
- Identify the main speakers and their key points
- Note any specific techniques, strategies, or advice given
- Capture the actual topics discussed, not generic categories
- Make summaries specific to the content, not generic descriptions

Please generate the following in JSON format (return ONLY valid JSON, no markdown):

{
  "title": "A compelling episode title that reflects the specific content (not generic)",
  "summary": "A detailed 3-4 paragraph summary that includes: specific topics discussed, key insights shared, notable examples or stories mentioned, and the main value propositions. Be specific about what was actually said, not generic descriptions.",
  "takeaways": ["Specific actionable insight 1 with context", "Specific actionable insight 2 with context", "Specific actionable insight 3 with context", "Specific actionable insight 4 with context", "Specific actionable insight 5 with context"],
  "topics": ["Specific topic 1 mentioned in video", "Specific topic 2 mentioned in video", "Specific topic 3 mentioned in video", "Specific topic 4 mentioned in video"],
  "cta": "A compelling call-to-action that references the specific value discussed in this video"
}

Focus on creating content that accurately represents what was actually discussed in the video, with specific details and actionable insights. Return ONLY the JSON object, no other text.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional podcast content creator. Generate engaging show notes in JSON format. Always return valid JSON only, no markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1200,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content generated from OpenAI');
    }

    // Parse JSON response
    const generatedContent = JSON.parse(content);
    
    // Validate required fields
    if (!generatedContent.title || !generatedContent.summary || !generatedContent.takeaways || !generatedContent.topics || !generatedContent.cta) {
      throw new Error('Generated content missing required fields');
    }

    return generatedContent;
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// Validate JWT token with Clerk
async function validateClerkToken(token: string): Promise<string | null> {
  const clerkSecretKey = Deno.env.get('CLERK_SECRET_KEY');
  
  if (!clerkSecretKey) {
    console.log('CLERK_SECRET_KEY not configured');
    return null;
  }
  
  try {
    const response = await fetch('https://api.clerk.com/v1/sessions/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user_id;
    }
  } catch (error) {
    console.error('Clerk token validation error:', error);
  }
  
  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('YouTube caption extraction request received');
    
    // For development/testing, skip authentication
    // Function deployed with --no-verify-jwt flag
    const userId = 'temp-user-id';

    // Parse request body
    const { youtubeUrl }: YouTubeRequest = await req.json();
    
    if (!youtubeUrl) {
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
    const videoId = extractVideoId(youtubeUrl);
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

    console.log(`Processing YouTube video: ${videoId}`);

    // Get video metadata (title, duration, and description)
    const videoMetadata = await getVideoMetadata(videoId);
    const videoTitle = videoMetadata.title;
    const videoDescription = videoMetadata.description;
    let videoDuration = videoMetadata.duration;
    
    console.log(`[Main Function] Video metadata:`);
    console.log(`[Main Function] - Title: ${videoTitle}`);
    console.log(`[Main Function] - Duration: ${videoDuration ? `${Math.floor(videoDuration / 60)}:${(videoDuration % 60).toString().padStart(2, '0')}` : 'Unknown'}`);
    console.log(`[Main Function] - Description: ${videoDescription ? `${videoDescription.substring(0, 100)}...` : 'Not available'}`);

    // Extract captions
    console.log('Extracting captions from YouTube...');
    const captions = await extractCaptions(videoId);
    
    // If we don't have duration from metadata, estimate it from captions
    if (!videoDuration && captions && captions.length > 0) {
      console.log('Duration not available from YouTube API, estimating from captions...');
      videoDuration = estimateDurationFromCaptions(captions);
      console.log(`✅ Final estimated duration: ${videoDuration} seconds (${Math.floor(videoDuration / 60)}:${(videoDuration % 60).toString().padStart(2, '0')})`);
    }
    
    // Final duration check before returning - ensure it's always a number
    console.log('🎬 DURATION EXTRACTION SUMMARY:');
    console.log('🎬 videoDuration value:', videoDuration);
    console.log('🎬 videoDuration type:', typeof videoDuration);
    console.log('🎬 Is defined?', videoDuration !== undefined);
    console.log('🎬 Number of captions:', captions?.length || 0);
    
    // Ensure videoDuration is always a number (not undefined or null)
    if (videoDuration === undefined || videoDuration === null) {
      console.log('⚠️  WARNING: videoDuration is undefined/null, setting to 0');
      videoDuration = 0;
    }
    
    // Convert to number if it's somehow not a number
    videoDuration = Number(videoDuration);
    console.log('🎬 Final videoDuration after conversion:', videoDuration);
    
    if (!captions || captions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'This video does not have captions available. Please try a different video.' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Format captions as plain text (like audio uploads)
    const transcript = captions.map(caption => caption.text).join(' ');
    console.log(`Formatted transcript: ${transcript.length} characters`);

    // Don't generate content immediately - let user generate it in ContentEditor
    // This matches the behavior of audio uploads

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For now, skip database save and return the data directly
    // TODO: Implement proper user authentication and database save
    console.log('Skipping database save - returning data directly');
    
    const youtubeEpisode = {
      id: `youtube-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      youtube_url: youtubeUrl,
      video_title: videoTitle,
      video_duration: videoDuration,
      transcript: transcript,
      generated_content: null, // No content generated yet
      created_at: new Date().toISOString()
    };
    
    /* Original database save code - disabled for testing
    const { data: youtubeEpisode, error: youtubeError } = await supabase
      .from('youtube_episodes')
      .insert({
        user_id: userId,
        youtube_url: youtubeUrl,
        video_title: videoTitle,
        transcript: transcript,
        generated_content: generatedContent
      })
      .select()
      .single();

    if (youtubeError) {
      console.error('Error saving to youtube_episodes:', youtubeError);
      throw new Error('Failed to save YouTube episode');
    }
    */

    // Skip main episodes table save for now
    // TODO: Re-enable when proper authentication is implemented
    console.log('Skipping main episodes table save');
    
    /* Original main episodes save code - disabled for testing
    const { data: mainEpisode, error: mainError } = await supabase
      .from('episodes')
      .insert({
        user_id: userId,
        title: generatedContent.title,
        transcript: transcript,
        summary_short: generatedContent.summary.substring(0, 200),
        summary_long: generatedContent.summary,
        chapters: captions.map((caption, index) => ({
          title: `Segment ${index + 1}`,
          start_time: caption.offset,
          end_time: caption.offset + (caption.duration * 1000)
        })),
        keywords: generatedContent.topics,
        quotes: generatedContent.takeaways.map(takeaway => ({
          text: takeaway,
          timestamp: 0
        })),
        source_type: 'youtube',
        youtube_url: youtubeUrl
      })
      .select()
      .single();

    if (mainError) {
      console.error('Error saving to episodes:', mainError);
      console.log('Main episode creation failed, but YouTube episode was saved');
    }
    */

    const response: YouTubeResponse = {
      success: true,
      episodeId: youtubeEpisode.id,
      transcript,
      generatedContent: undefined, // No content generated yet
      videoTitle,
      videoDescription,
      videoDuration: videoDuration, // Already ensured to be a number above
      message: 'YouTube captions extracted successfully. Use the Generate AI Content button to create summaries and chapters.'
    };

    console.log('📤 SENDING RESPONSE:');
    console.log('📤 videoDuration value:', response.videoDuration);
    console.log('📤 videoDuration type:', typeof response.videoDuration);
    console.log('📤 Has videoDuration property?', 'videoDuration' in response);
    console.log('📤 All response keys:', Object.keys(response));
    
    const responseString = JSON.stringify(response);
    console.log('📤 Response JSON:', responseString);
    
    // Verify videoDuration is in the JSON
    const parsedCheck = JSON.parse(responseString);
    console.log('📤 Parsed check videoDuration:', parsedCheck.videoDuration);

    return new Response(
      responseString,
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('YouTube caption processing error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
