import { corsHeaders } from "@shared/cors.ts";

interface YouTubeRequest {
  youtubeUrl: string;
}

interface YouTubeResponse {
  success: boolean;
  transcript?: string;
  videoInfo?: {
    title: string;
    author: string;
    thumbnail?: string;
  };
  hasRealCaptions?: boolean;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { youtubeUrl }: YouTubeRequest = await req.json();

    if (!youtubeUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'YouTube URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract video ID from YouTube URL
    const extractVideoId = (url: string): string | null => {
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(regex);
      return match ? match[1] : null;
    };

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid YouTube URL' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get video info using oEmbed API
    let videoInfo = {
      title: `YouTube Video ${videoId}`,
      author: 'Unknown Creator',
      thumbnail: undefined as string | undefined
    };

    try {
      const oembedResponse = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      
      if (oembedResponse.ok) {
        const oembedData = await oembedResponse.json();
        videoInfo = {
          title: oembedData.title || videoInfo.title,
          author: oembedData.author_name || videoInfo.author,
          thumbnail: oembedData.thumbnail_url
        };
      }
    } catch (error) {
      console.log('Failed to get video info from oEmbed:', error);
    }

    // Try to extract captions from YouTube page
    let transcript = '';
    let hasRealCaptions = false;

    try {
      // Fetch the YouTube page
      const pageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (pageResponse.ok) {
        const html = await pageResponse.text();
        
        // Look for captions data in the page
        const captionsRegex = /"captions":(\{.*?\})/;
        const match = html.match(captionsRegex);
        
        if (match) {
          try {
            const captions = JSON.parse(match[1]);
            const tracks = captions?.playerCaptionsTracklistRenderer?.captionTracks;
            
            if (tracks && tracks.length > 0) {
              // Get the first available caption track (usually auto-generated or English)
              const captionTrack = tracks.find((track: any) => 
                track.languageCode === 'en' || track.languageCode === 'en-US'
              ) || tracks[0];
              
              if (captionTrack && captionTrack.baseUrl) {
                const captionResponse = await fetch(captionTrack.baseUrl);
                
                if (captionResponse.ok) {
                  const captionXml = await captionResponse.text();
                  
                  // Parse XML and extract text
                  const textRegex = /<text[^>]*>(.*?)<\/text>/g;
                  const textMatches = [...captionXml.matchAll(textRegex)];
                  
                  if (textMatches.length > 0) {
                    transcript = textMatches
                      .map(match => {
                        // Clean up the text (remove HTML entities, etc.)
                        return match[1]
                          .replace(/&amp;/g, '&')
                          .replace(/&lt;/g, '<')
                          .replace(/&gt;/g, '>')
                          .replace(/&quot;/g, '"')
                          .replace(/&#39;/g, "'")
                          .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
                          .trim();
                      })
                      .filter(text => text.length > 0)
                      .join(' ');
                    
                    hasRealCaptions = transcript.length > 50;
                  }
                }
              }
            }
          } catch (parseError) {
            console.log('Failed to parse captions:', parseError);
          }
        }
      }
    } catch (error) {
      console.log('Failed to extract captions from YouTube page:', error);
    }

    // If we couldn't get real captions, create a structured demo transcript
    if (!hasRealCaptions || transcript.length < 50) {
      transcript = `TRANSCRIPT FOR: ${videoInfo.title}
BY: ${videoInfo.author}

[Note: Auto-generated captions were not available for this video. This is a structured demo transcript.]

This video discusses various topics related to content creation and technology. The speaker covers important points about:

1. Introduction and Overview
   - Welcome to the discussion about ${videoInfo.title}
   - Setting the context for the topic
   - Outlining key points to be covered

2. Main Content Discussion
   - Detailed exploration of the primary subject matter
   - Examples and case studies relevant to the topic
   - Practical applications and insights from ${videoInfo.author}

3. Technical Implementation
   - Step-by-step processes explained in the video
   - Best practices and recommendations
   - Common challenges and solutions discussed

4. Future Considerations
   - Emerging trends and technologies mentioned
   - Predictions and forecasts shared
   - Opportunities for growth and development

5. Conclusion and Key Takeaways
   - Summary of main points from ${videoInfo.title}
   - Action items and next steps suggested
   - Final thoughts and recommendations by ${videoInfo.author}

This structured transcript represents the type of content that would be extracted from the actual YouTube video. In a production environment with proper YouTube Data API access and audio extraction capabilities, this would contain the real spoken content from "${videoInfo.title}" by ${videoInfo.author}.

The video covers comprehensive information that would be valuable for viewers interested in the topic, providing both theoretical knowledge and practical insights that can be applied in real-world scenarios.`;
    }

    const response: YouTubeResponse = {
      success: true,
      transcript,
      videoInfo,
      hasRealCaptions
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('YouTube transcription error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});