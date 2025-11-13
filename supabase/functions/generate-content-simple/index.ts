import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface GenerateContentRequest {
  transcript: string;
  videoTitle?: string;
  author?: string;
  userId?: string;
  episodeId?: string;
  enablePersonalization?: boolean;
}

interface GeneratedContent {
  summary: {
    short: string;
    long: string;
  };
  chapters: Array<{
    timestamp: string;
    title: string;
    content: string;
  }>;
  keywords: string[];
  quotes: Array<{
    text: string;
    speaker?: string;
    timestamp?: string;
  }>;
}

// Check if OpenAI API key is available
const isOpenAIAvailable = (): boolean => {
  const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("VITE_OPENAI_API_KEY");
  return !!apiKey && apiKey.trim().length > 0;
};

// Batch content generation - single API call for all content
const generateAllContent = async (transcript: string): Promise<GeneratedContent> => {
  const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("VITE_OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `Analyze this podcast/video transcript and generate all content in a single JSON response. Return ONLY valid JSON, no markdown or additional text.

Required JSON structure:
{
  "summary": {
    "short": "A concise 2-3 sentence summary focusing on the main topic and key value proposition.",
    "long": "A detailed 3-4 paragraph summary including specific topics discussed, key insights shared, notable examples or stories mentioned, and the main value propositions."
  },
  "chapters": [
    {
      "timestamp": "00:00",
      "title": "Chapter Title",
      "content": "Brief description of what's covered in this chapter"
    }
  ],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "quotes": [
    {
      "text": "The actual quote text",
      "speaker": "Speaker name if mentioned",
      "timestamp": "00:00"
    }
  ]
}

Requirements:
- Generate 5-8 chapter markers with timestamps
- Extract 8-12 relevant keywords for SEO
- Extract 3-5 memorable quotes with timestamps if possible
- Be specific and accurate to the actual transcript content
- Return ONLY the JSON object, no other text

Transcript:
${transcript}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert content creator specializing in podcast and video content analysis. Always return valid JSON only, no markdown formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error:", response.status, errorText);
    throw new Error(`OpenAI API failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "";
  
  if (!content) {
    throw new Error("No content generated from OpenAI");
  }

  try {
    // Parse JSON response
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    
    // Validate and return with fallbacks
    return {
      summary: {
        short: parsed.summary?.short || "A concise summary of the podcast/video content.",
        long: parsed.summary?.long || "A detailed summary of the podcast/video content covering key topics and insights."
      },
      chapters: Array.isArray(parsed.chapters) && parsed.chapters.length > 0
        ? parsed.chapters
        : [
            { timestamp: "00:00", title: "Introduction", content: "Opening segment" },
            { timestamp: "05:00", title: "Main Content", content: "Core discussion" },
            { timestamp: "15:00", title: "Conclusion", content: "Closing thoughts" }
          ],
      keywords: Array.isArray(parsed.keywords) && parsed.keywords.length > 0
        ? parsed.keywords
        : ["podcast", "discussion", "insights", "tips", "advice"],
      quotes: Array.isArray(parsed.quotes) && parsed.quotes.length > 0
        ? parsed.quotes
        : [
            { text: "Key insight from the discussion", speaker: "Speaker", timestamp: "00:00" }
          ]
    };
  } catch (parseError) {
    console.error("JSON parsing error:", parseError, "Content:", content);
    // Return fallback content
    return {
      summary: {
        short: "A concise summary of the podcast/video content.",
        long: "A detailed summary of the podcast/video content covering key topics and insights."
      },
      chapters: [
        { timestamp: "00:00", title: "Introduction", content: "Opening segment" },
        { timestamp: "05:00", title: "Main Content", content: "Core discussion" },
        { timestamp: "15:00", title: "Conclusion", content: "Closing thoughts" }
      ],
      keywords: ["podcast", "discussion", "insights", "tips", "advice"],
      quotes: [
        { text: "Key insight from the discussion", speaker: "Speaker", timestamp: "00:00" }
      ]
    };
  }
};


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!isOpenAIAvailable()) {
      throw new Error("OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.");
    }

    const { 
      transcript, 
      videoTitle, 
      author, 
      userId, 
      episodeId, 
      enablePersonalization = false 
    }: GenerateContentRequest = await req.json();

    if (!transcript || transcript.trim().length === 0) {
      throw new Error("Transcript is required");
    }

    console.log("Starting batched content generation for transcript length:", transcript.length);

    // Generate all content in a single API call
    const generatedContent = await generateAllContent(transcript);

    console.log("Content generation completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        generatedContent,
        metadata: {
          videoTitle,
          author,
          generatedAt: new Date().toISOString(),
          transcriptLength: transcript.length,
          personalizationEnabled: enablePersonalization
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Content generation error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to generate content"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
