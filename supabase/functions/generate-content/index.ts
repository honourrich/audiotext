import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateContentRequest {
  transcript: string;
  videoTitle?: string;
  author?: string;
  userId?: string;
  episodeId?: string;
  enablePersonalization?: boolean;
}

interface PersonalizationContext {
  personalityProfile?: any;
  brandVoiceProfile?: any;
  settings?: any;
  detectedGenre?: string;
  genreTemplate?: any;
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
  personalization?: {
    detectedGenre: string;
    personalityFitScore: number;
    brandVoiceScore: number;
    extractedResources: any[];
    appliedTemplate: string;
  };
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Check if OpenAI API key is available
const isOpenAIAvailable = (): boolean => {
  const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("VITE_OPENAI_API_KEY");
  return !!apiKey && apiKey.trim().length > 0;
};

// Load personalization context
const loadPersonalizationContext = async (userId: string): Promise<PersonalizationContext> => {
  try {
    const [personalityResult, brandVoiceResult, settingsResult, templatesResult] = await Promise.allSettled([
      supabase.from('user_personality_profiles').select('*').eq('user_id', userId).single(),
      supabase.from('brand_voice_profiles').select('*').eq('user_id', userId).single(),
      supabase.from('personalization_settings').select('*').eq('user_id', userId).single(),
      supabase.from('genre_templates').select('*').eq('is_active', true)
    ]);

    return {
      personalityProfile: personalityResult.status === 'fulfilled' ? personalityResult.value.data : null,
      brandVoiceProfile: brandVoiceResult.status === 'fulfilled' ? brandVoiceResult.value.data : null,
      settings: settingsResult.status === 'fulfilled' ? settingsResult.value.data : null,
    };
  } catch (error) {
    console.error('Failed to load personalization context:', error);
    return {};
  }
};

// Detect genre using AI
const detectGenre = async (transcript: string, title: string): Promise<string> => {
  const prompt = `Analyze this podcast/video content and classify it into one of these genres:
- business: Professional business content, entrepreneurship, strategy, marketing
- comedy: Entertainment, humor, comedy shows, funny conversations  
- education: Learning content, tutorials, academic discussions, how-to
- interview: Guest interviews, conversations, Q&A sessions
- storytelling: Narrative content, personal stories, experiences

Content Title: ${title}
Content: ${transcript.substring(0, 2000)}...

Respond with just the genre name (business, comedy, education, interview, or storytelling).`;

  try {
    const result = await callOpenAI(prompt, "");
    const genre = result.toLowerCase().trim();
    return ['business', 'comedy', 'education', 'interview', 'storytelling'].includes(genre) ? genre : 'business';
  } catch (error) {
    console.error('Genre detection failed:', error);
    return 'business'; // Default fallback
  }
};

// Extract resources from content
const extractResources = async (text: string): Promise<any[]> => {
  try {
    const { data: resources } = await supabase
      .from('resource_database')
      .select('*')
      .eq('auto_link_enabled', true);

    if (!resources) return [];

    const extractedResources: any[] = [];
    const lowerText = text.toLowerCase();

    for (const resource of resources) {
      const names = [resource.resource_name, ...resource.alternative_names];
      
      for (const name of names) {
        if (lowerText.includes(name.toLowerCase())) {
          extractedResources.push({
            ...resource,
            context: extractContext(text, name)
          });
          
          // Update usage count
          await supabase
            .from('resource_database')
            .update({ usage_count: resource.usage_count + 1 })
            .eq('id', resource.id);
          
          break;
        }
      }
    }

    return extractedResources;
  } catch (error) {
    console.error('Resource extraction failed:', error);
    return [];
  }
};

// Extract context around a mentioned resource
const extractContext = (text: string, resourceName: string): string => {
  const index = text.toLowerCase().indexOf(resourceName.toLowerCase());
  if (index === -1) return '';
  
  const start = Math.max(0, index - 100);
  const end = Math.min(text.length, index + resourceName.length + 100);
  return text.substring(start, end);
};

// Build personalized prompt
const buildPersonalizedPrompt = (
  basePrompt: string,
  context: PersonalizationContext,
  detectedGenre: string
): string => {
  let personalizedPrompt = basePrompt;

  // Apply personality profile adjustments
  if (context.personalityProfile) {
    const profile = context.personalityProfile;
    
    if (profile.formality_score > 0.7) {
      personalizedPrompt += "\n\nStyle Guidelines: Use formal, professional language. Avoid casual expressions.";
    } else if (profile.formality_score < 0.4) {
      personalizedPrompt += "\n\nStyle Guidelines: Use conversational, casual tone. Include friendly expressions.";
    }

    if (profile.enthusiasm_score > 0.7) {
      personalizedPrompt += " Use enthusiastic language and exclamation points where appropriate.";
    }

    if (profile.technical_depth > 0.7) {
      personalizedPrompt += " Include technical details and industry-specific terminology.";
    }

    personalizedPrompt += `\n\nPersonality Context: Average sentence length should be around ${profile.avg_sentence_length} words.`;
  }

  // Apply brand voice adjustments
  if (context.brandVoiceProfile) {
    const brand = context.brandVoiceProfile;
    personalizedPrompt += `\n\nBrand Voice: Maintain ${Math.round(brand.formality_score * 100)}% formality, ${Math.round(brand.enthusiasm_score * 100)}% enthusiasm.`;
    
    if (brand.brand_keywords.length > 0) {
      personalizedPrompt += ` Incorporate these brand keywords naturally: ${brand.brand_keywords.slice(0, 5).join(', ')}.`;
    }
  }

  // Apply genre template
  const genreInstructions = {
    business: "Focus on actionable insights, key takeaways, and business value. Include metrics and ROI where relevant.",
    comedy: "Highlight funny moments, running jokes, and entertaining segments. Use casual, fun language.",
    education: "Structure content with clear learning objectives, key concepts, and practical examples.",
    interview: "Emphasize guest insights, notable quotes, and key discussion points.",
    storytelling: "Focus on narrative structure, character development, and emotional moments."
  };

  if (genreInstructions[detectedGenre as keyof typeof genreInstructions]) {
    personalizedPrompt += `\n\nGenre-Specific Instructions: ${genreInstructions[detectedGenre as keyof typeof genreInstructions]}`;
  }

  return personalizedPrompt;
};

// Make OpenAI API call
const callOpenAI = async (prompt: string, transcript: string): Promise<string> => {
  const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("VITE_OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert content creator and editor specializing in podcast and video content analysis. You adapt your writing style based on provided guidelines."
        },
        {
          role: "user",
          content: `${prompt}${transcript ? `\n\nTranscript:\n${transcript}` : ''}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error:", response.status, errorText);
    throw new Error(`OpenAI API failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
};

// Generate personalized summary
const generateSummary = async (
  transcript: string, 
  context: PersonalizationContext, 
  detectedGenre: string
): Promise<{ short: string; long: string }> => {
  const basePrompt = `Create two versions of a summary for this podcast/video transcript:

1. SHORT (2-3 sentences): A concise, engaging summary that captures the main topics and key insights. Make it compelling for potential listeners.

2. LONG (1 paragraph): A more detailed summary that provides context and highlights the most valuable takeaways.

Format your response as:
SHORT: [your short summary]
LONG: [your long summary]`;

  const personalizedPrompt = buildPersonalizedPrompt(basePrompt, context, detectedGenre);
  const result = await callOpenAI(personalizedPrompt, transcript);
  
  const shortMatch = result.match(/SHORT:\s*(.*?)(?=LONG:|$)/s);
  const longMatch = result.match(/LONG:\s*(.*?)$/s);
  
  return {
    short: shortMatch?.[1]?.trim() || "Summary not available",
    long: longMatch?.[1]?.trim() || "Detailed summary not available"
  };
};

// Generate personalized chapters
const generateChapters = async (
  transcript: string, 
  context: PersonalizationContext, 
  detectedGenre: string
): Promise<Array<{ timestamp: string; title: string; content: string }>> => {
  const basePrompt = `Break this transcript into 5-8 logical chapters with timestamps and descriptive titles. Each chapter should represent a distinct topic or conversation segment.

Format your response as:
CHAPTER 1: 00:00:00 - [Descriptive Title]
[Brief description of what's covered in this chapter]

CHAPTER 2: 00:05:30 - [Descriptive Title]
[Brief description of what's covered in this chapter]

Continue this pattern for all chapters. Make timestamps realistic based on content length.`;

  const personalizedPrompt = buildPersonalizedPrompt(basePrompt, context, detectedGenre);
  const result = await callOpenAI(personalizedPrompt, transcript);
  
  const chapters: Array<{ timestamp: string; title: string; content: string }> = [];
  const chapterMatches = result.match(/CHAPTER \d+:\s*(\d{2}:\d{2}:\d{2})\s*-\s*(.*?)\n(.*?)(?=CHAPTER \d+:|$)/gs);
  
  if (chapterMatches) {
    chapterMatches.forEach(match => {
      const parts = match.match(/CHAPTER \d+:\s*(\d{2}:\d{2}:\d{2})\s*-\s*(.*?)\n(.*?)$/s);
      if (parts) {
        chapters.push({
          timestamp: parts[1],
          title: parts[2].trim(),
          content: parts[3].trim()
        });
      }
    });
  }
  
  return chapters;
};

// Generate personalized keywords
const generateKeywords = async (
  transcript: string, 
  context: PersonalizationContext, 
  detectedGenre: string
): Promise<string[]> => {
  const basePrompt = `Extract 10-15 SEO-optimized keywords and topics from this content. Include both broad categories and specific terms that would help people discover this content.

Format your response as a simple comma-separated list:
keyword1, keyword2, keyword3, etc.`;

  const personalizedPrompt = buildPersonalizedPrompt(basePrompt, context, detectedGenre);
  const result = await callOpenAI(personalizedPrompt, transcript);
  
  return result
    .split(',')
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0)
    .slice(0, 15);
};

// Generate personalized quotes
const generateQuotes = async (
  transcript: string, 
  context: PersonalizationContext, 
  detectedGenre: string
): Promise<Array<{ text: string; speaker?: string; timestamp?: string }>> => {
  const basePrompt = `Find the 5 most impactful, quotable moments from this transcript. Choose quotes that are insightful, memorable, or would perform well on social media.

Format your response as:
QUOTE 1: "[exact quote text]" - Speaker Name (if identifiable)
QUOTE 2: "[exact quote text]" - Speaker Name (if identifiable)
Continue this pattern...`;

  const personalizedPrompt = buildPersonalizedPrompt(basePrompt, context, detectedGenre);
  const result = await callOpenAI(personalizedPrompt, transcript);
  
  const quotes: Array<{ text: string; speaker?: string; timestamp?: string }> = [];
  const quoteMatches = result.match(/QUOTE \d+:\s*"([^"]+)"\s*(?:-\s*([^(]+))?/g);
  
  if (quoteMatches) {
    quoteMatches.forEach(match => {
      const parts = match.match(/QUOTE \d+:\s*"([^"]+)"\s*(?:-\s*([^(]+))?/);
      if (parts) {
        quotes.push({
          text: parts[1].trim(),
          speaker: parts[2]?.trim() || undefined
        });
      }
    });
  }
  
  return quotes;
};

// Calculate personality fit score
const calculatePersonalityFitScore = (content: string, personalityProfile: any): number => {
  if (!personalityProfile) return 0.5;
  
  // Simplified scoring based on content characteristics
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
  
  const lengthDiff = Math.abs(avgSentenceLength - personalityProfile.avg_sentence_length) / personalityProfile.avg_sentence_length;
  const lengthScore = Math.max(0, 1 - lengthDiff);
  
  return Math.min(1, lengthScore);
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

    console.log("Starting content generation for transcript length:", transcript.length);

    let personalizationContext: PersonalizationContext = {};
    let detectedGenre = 'business';
    let extractedResources: any[] = [];

    // Load personalization context if enabled and userId provided
    if (enablePersonalization && userId) {
      console.log("Loading personalization context for user:", userId);
      personalizationContext = await loadPersonalizationContext(userId);
      
      // Detect genre
      if (personalizationContext.settings?.enable_genre_detection !== false) {
        detectedGenre = await detectGenre(transcript, videoTitle || '');
        console.log("Detected genre:", detectedGenre);
      }
      
      // Extract resources
      if (personalizationContext.settings?.enable_resource_linking !== false) {
        extractedResources = await extractResources(transcript);
        console.log("Extracted resources:", extractedResources.length);
      }
    }

    // Run all generation tasks in parallel for efficiency
    const [summary, chapters, keywords, quotes] = await Promise.all([
      generateSummary(transcript, personalizationContext, detectedGenre),
      generateChapters(transcript, personalizationContext, detectedGenre),
      generateKeywords(transcript, personalizationContext, detectedGenre),
      generateQuotes(transcript, personalizationContext, detectedGenre)
    ]);

    const generatedContent: GeneratedContent = {
      summary,
      chapters,
      keywords,
      quotes
    };

    // Add personalization data if enabled
    if (enablePersonalization && userId) {
      const personalityFitScore = calculatePersonalityFitScore(
        summary.long, 
        personalizationContext.personalityProfile
      );

      generatedContent.personalization = {
        detectedGenre,
        personalityFitScore,
        brandVoiceScore: 0.8, // Simplified for now
        extractedResources,
        appliedTemplate: detectedGenre
      };

      // Save personalization data to database
      if (episodeId) {
        try {
          await supabase.from('episode_personalization_data').upsert({
            episode_id: episodeId,
            user_id: userId,
            detected_genre: detectedGenre,
            personality_fit_score: personalityFitScore,
            brand_voice_score: 0.8,
            extracted_resources: { resources: extractedResources },
            personalization_applied: {
              genre_template: detectedGenre,
              personality_adjustments: !!personalizationContext.personalityProfile,
              brand_voice_adjustments: !!personalizationContext.brandVoiceProfile
            }
          });
        } catch (error) {
          console.error('Failed to save personalization data:', error);
        }
      }
    }

    console.log("Content generation completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        metadata: {
          videoTitle,
          author,
          generatedAt: new Date().toISOString(),
          transcriptLength: transcript.length,
          personalizationEnabled: enablePersonalization,
          detectedGenre: enablePersonalization ? detectedGenre : undefined
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