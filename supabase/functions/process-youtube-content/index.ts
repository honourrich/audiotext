import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  generatedContent?: GeneratedContent;
  transcript?: string;
  message?: string;
  error?: string;
}

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Get video title using oEmbed API
async function getVideoTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (response.ok) {
      const data = await response.json();
      return data.title || `YouTube Video ${videoId}`;
    }
  } catch (error) {
    console.error("Failed to get video title:", error);
  }
  return `YouTube Video ${videoId}`;
}

// Extract YouTube captions using multiple methods
async function extractYouTubeCaptions(videoId: string): Promise<string | null> {
  try {
    console.log(`Attempting to extract captions for video: ${videoId}`);
    
    // Method 1: Try YouTube's transcript API with different formats
    const captionUrls = [
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-US&fmt=json3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=json3`
    ];
    
    for (const captionUrl of captionUrls) {
      try {
        console.log(`Trying caption URL: ${captionUrl}`);
        const response = await fetch(captionUrl, {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            // JSON3 format
            const data = await response.json();
            if (data && data.events) {
              const captions = data.events
                .filter((event: any) => event.segs && event.segs.length > 0)
                .map((event: any) => ({
                  text: event.segs.map((seg: any) => seg.utf8).join(''),
                  start: event.tStartMs / 1000,
                  duration: (event.dDurationMs || 1000) / 1000
                }))
                .filter((caption: any) => caption.text.trim().length > 0);
              
              if (captions.length > 0) {
                const transcript = captions.map(c => c.text).join(' ');
                console.log(`Successfully extracted ${captions.length} caption segments using JSON3 format`);
                return transcript.trim();
              }
            }
          } else {
            // SRV3 or XML format
            const text = await response.text();
            if (text && text.includes('<text')) {
              const parser = new DOMParser();
              const doc = parser.parseFromString(text, 'text/xml');
              const textElements = doc.querySelectorAll('text');
              
              if (textElements.length > 0) {
                const transcript = Array.from(textElements)
                  .map(element => element.textContent || '')
                  .filter(text => text.trim().length > 0)
                  .join(' ');
                
                if (transcript.trim()) {
                  console.log(`Successfully extracted ${textElements.length} caption segments using XML format`);
                  return transcript.trim();
                }
              }
            }
          }
        }
      } catch (urlError) {
        console.log(`Failed with URL: ${captionUrl}`, urlError);
      }
    }
    
    console.log('All caption extraction methods failed');
    return null;
    
  } catch (error) {
    console.error('Error fetching YouTube captions:', error);
    return null;
  }
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('YouTube content processing request received');
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authorization token required' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Validate Clerk token
    const userId = await validateClerkToken(token);
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired authentication token' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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

    // Get video title
    const videoTitle = await getVideoTitle(videoId);
    console.log(`Video title: ${videoTitle}`);

    // Extract captions
    const transcript = await extractYouTubeCaptions(videoId);
    if (!transcript || transcript.length < 50) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'This video does not have captions available. Please try a video with auto-generated or manual captions.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Transcript extracted: ${transcript.length} characters`);

    // Don't generate content immediately - let user generate it in ContentEditor
    // This matches the behavior of audio uploads

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save to youtube_episodes table
    const { data: youtubeEpisode, error: youtubeError } = await supabase
      .from('youtube_episodes')
      .insert({
        user_id: userId,
        youtube_url: youtubeUrl,
        video_title: videoTitle,
        transcript: transcript,
        generated_content: null // No content generated yet
      })
      .select()
      .single();

    if (youtubeError) {
      console.error('Error saving to youtube_episodes:', youtubeError);
      throw new Error('Failed to save YouTube episode');
    }

    // Don't create main episode entry yet - let user generate content first

    const response: YouTubeResponse = {
      success: true,
      episodeId: youtubeEpisode.id,
      generatedContent: undefined, // No content generated yet
      transcript,
      videoTitle,
      message: 'YouTube captions extracted successfully. Use the Generate AI Content button to create summaries and chapters.'
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('YouTube processing error:', error);
    
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
