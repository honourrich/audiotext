import { corsHeaders } from "@shared/cors.ts";

interface SocialMediaPost {
  platform: string;
  content: string;
  [key: string]: any;
}

interface AnalysisRequest {
  posts: SocialMediaPost[];
  analysisType?: 'style' | 'content' | 'full';
}

interface AnalysisResponse {
  success: boolean;
  analysis?: any;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('VITE_OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI API key not configured. Please check your environment variables.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestBody: AnalysisRequest = await req.json();
    const { posts, analysisType = 'style' } = requestBody;

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Posts array is required and must not be empty' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Group posts by platform for platform-specific analysis
    const postsByPlatform = posts.reduce((acc, post) => {
      if (!acc[post.platform]) acc[post.platform] = [];
      acc[post.platform].push(post);
      return acc;
    }, {} as Record<string, SocialMediaPost[]>);

    // Prepare system prompt based on analysis type
    let systemPrompt = '';
    if (analysisType === 'style') {
      systemPrompt = `You are a writing style analyst. Analyze the following social media posts and provide a detailed writing style profile. Return a JSON object with the following structure:
{
  "analysis_data": {
    "tone": "professional/casual/humorous/serious",
    "formality": 0.0-1.0,
    "humor_style": "description",
    "vocabulary_level": "basic/intermediate/advanced",
    "common_phrases": ["phrase1", "phrase2"],
    "storytelling_approach": "description",
    "engagement_techniques": ["technique1", "technique2"],
    "platform_specific_styles": {
      "platform_name": {
        "character_length_avg": number,
        "hashtag_usage": "description",
        "emoji_usage": "description"
      }
    }
  }
}

Return ONLY valid JSON, no additional text.`;
    } else {
      systemPrompt = `You are a social media content analyst. Analyze the following posts and provide comprehensive insights. Return valid JSON only.`;
    }

    const postsText = JSON.stringify(postsByPlatform, null, 2);

    // Call OpenAI API
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Analyze these social media posts:\n\n${postsText}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      
      let errorMessage = 'OpenAI API request failed';
      if (response.status === 401) {
        errorMessage = 'Invalid OpenAI API key. Please check your configuration.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else {
        errorMessage = errorData.error?.message || `API error (${response.status})`;
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No content returned from OpenAI API' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      // If parsing fails, return the raw content
      analysis = { raw_analysis: content };
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Social media analysis error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

