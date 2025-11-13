import { useAuth } from "@clerk/clerk-react";

// Custom hook for making authenticated API calls
export const useAuthenticatedFetch = () => {
  const { getToken } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    try {
      const token = await getToken();

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed");
        }
        if (response.status === 403) {
          throw new Error("Access denied");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  };

  return { authenticatedFetch };
};

// YouTube transcript extraction
export const extractYouTubeTranscript = async (
  youtubeUrl: string,
): Promise<string> => {
  try {
    // Extract video ID from YouTube URL
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    // Try to get transcript using YouTube's API
    try {
      const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
      const html = await response.text();
      
      // Look for captions in the page
      const captionsRegex = /"captions":(\{.*?\})/;
      const match = html.match(captionsRegex);
      
      if (match) {
        const captions = JSON.parse(match[1]);
        const tracks = captions?.playerCaptionsTracklistRenderer?.captionTracks;
        
        if (tracks && tracks.length > 0) {
          // Get the first available caption track (usually auto-generated or English)
          const captionUrl = tracks[0].baseUrl;
          const captionResponse = await fetch(captionUrl);
          const captionXml = await captionResponse.text();
          
          // Parse XML and extract text
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(captionXml, 'text/xml');
          const textElements = xmlDoc.getElementsByTagName('text');
          
          let transcript = '';
          for (let i = 0; i < textElements.length; i++) {
            const text = textElements[i].textContent || '';
            // Clean up the text (remove HTML entities, etc.)
            const cleanText = text.replace(/&amp;/g, '&')
                                 .replace(/&lt;/g, '<')
                                 .replace(/&gt;/g, '>')
                                 .replace(/&quot;/g, '"')
                                 .replace(/&#39;/g, "'");
            transcript += cleanText + ' ';
          }
          
          if (transcript.trim()) {
            return transcript.trim();
          }
        }
      }
    } catch (error) {
      console.warn('Failed to extract captions directly:', error);
    }

    // Fallback: Use a more detailed mock transcript with video ID
    return `Real transcript extraction for video ${videoId} would require server-side implementation or YouTube API access. 

This is a demonstration of how the transcript would appear. In a production environment, you would:

1. Use YouTube Data API v3 to get video details
2. Extract captions using youtube-transcript library on your backend
3. Or use OpenAI Whisper API to transcribe the audio directly

The video URL you provided: ${youtubeUrl}
Video ID extracted: ${videoId}

This mock transcript represents what would be the actual spoken content from the YouTube video, properly formatted and ready for AI processing to generate summaries, chapters, and keywords.`;
  } catch (error) {
    console.error("Failed to extract YouTube transcript:", error);
    throw error;
  }
};

// Extract video ID from YouTube URL
const extractVideoId = (url: string): string | null => {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// OpenAI API integration for content generation
export const generateContentWithOpenAI = async (transcript: string) => {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenAI API key not found, using mock data');
      // Fallback to mock data if no API key
      const summary = await generateSummary(transcript);
      const chapters = await generateChapters(transcript);
      const keywords = await generateKeywords(transcript);
      
      return {
        summary,
        chapters,
        keywords,
      };
    }

    // Real OpenAI API calls
    const [summary, chapters, keywords] = await Promise.all([
      generateRealSummary(transcript, apiKey),
      generateRealChapters(transcript, apiKey),
      generateRealKeywords(transcript, apiKey)
    ]);

    return {
      summary,
      chapters,
      keywords,
    };
  } catch (error) {
    console.error("Failed to generate content with OpenAI:", error);
    // Fallback to mock data on error
    const summary = await generateSummary(transcript);
    const chapters = await generateChapters(transcript);
    const keywords = await generateKeywords(transcript);
    
    return {
      summary,
      chapters,
      keywords,
    };
  }
};

// Real OpenAI API calls
const generateRealSummary = async (transcript: string, apiKey: string): Promise<string> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates concise, informative summaries of transcripts. Focus on key points, main themes, and important takeaways.'
          },
          {
            role: 'user',
            content: `Please create a comprehensive summary of the following transcript:\n\n${transcript}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Failed to generate summary';
  } catch (error) {
    console.error('Failed to generate real summary:', error);
    return await generateSummary(transcript); // Fallback to mock
  }
};

const generateRealChapters = async (transcript: string, apiKey: string) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates chapter breakdowns for transcripts. Return a JSON array of chapters with id, title, startTime, endTime, and summary fields. Estimate reasonable time stamps.'
          },
          {
            role: 'user',
            content: `Please create chapter breakdowns for the following transcript. Return only valid JSON:\n\n${transcript}`
          }
        ],
        max_tokens: 800,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    try {
      return JSON.parse(content);
    } catch {
      // If JSON parsing fails, return mock chapters
      return await generateChapters(transcript);
    }
  } catch (error) {
    console.error('Failed to generate real chapters:', error);
    return await generateChapters(transcript); // Fallback to mock
  }
};

const generateRealKeywords = async (transcript: string, apiKey: string): Promise<string[]> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that extracts relevant keywords and key phrases from transcripts. Return a JSON array of strings containing the most important keywords and phrases.'
          },
          {
            role: 'user',
            content: `Please extract the most relevant keywords and key phrases from the following transcript. Return only a JSON array of strings:\n\n${transcript}`
          }
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    try {
      return JSON.parse(content);
    } catch {
      // If JSON parsing fails, return mock keywords
      return await generateKeywords(transcript);
    }
  } catch (error) {
    console.error('Failed to generate real keywords:', error);
    return await generateKeywords(transcript); // Fallback to mock
  }
};

// Mock OpenAI API calls (these should be implemented on your backend)
const generateSummary = async (transcript: string): Promise<string> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return `AI-generated summary based on the transcript: This content discusses various topics extracted from the provided audio. The summary includes key points, main themes, and important takeaways from the conversation.`;
};

const generateChapters = async (transcript: string) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return [
    {
      id: "1",
      title: "Introduction",
      startTime: "00:00",
      endTime: "05:00",
      summary: "Opening remarks and topic introduction",
    },
    {
      id: "2",
      title: "Main Discussion",
      startTime: "05:00",
      endTime: "15:00",
      summary: "Core content and key points",
    },
    {
      id: "3",
      title: "Conclusion",
      startTime: "15:00",
      endTime: "20:00",
      summary: "Wrap-up and final thoughts",
    },
  ];
};

const generateKeywords = async (transcript: string): Promise<string[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    "artificial intelligence",
    "content creation",
    "automation",
    "productivity",
    "technology",
  ];
};

// API service functions
export const apiService = {
  // Episodes
  async getEpisodes() {
    const { authenticatedFetch } = useAuthenticatedFetch();
    return authenticatedFetch("/api/episodes");
  },

  async createEpisode(data: {
    title: string;
    audioUrl?: string;
    youtubeUrl?: string;
  }) {
    const { authenticatedFetch } = useAuthenticatedFetch();
    return authenticatedFetch("/api/episodes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getEpisode(id: string) {
    const { authenticatedFetch } = useAuthenticatedFetch();
    return authenticatedFetch(`/api/episodes/${id}`);
  },

  async updateEpisode(id: string, data: any) {
    const { authenticatedFetch } = useAuthenticatedFetch();
    return authenticatedFetch(`/api/episodes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteEpisode(id: string) {
    const { authenticatedFetch } = useAuthenticatedFetch();
    return authenticatedFetch(`/api/episodes/${id}`, {
      method: "DELETE",
    });
  },

  // User & Subscription
  async getUserProfile() {
    const { authenticatedFetch } = useAuthenticatedFetch();
    return authenticatedFetch("/api/user/profile");
  },

  async getSubscription() {
    const { authenticatedFetch } = useAuthenticatedFetch();
    return authenticatedFetch("/api/user/subscription");
  },

  async getUsage() {
    const { authenticatedFetch } = useAuthenticatedFetch();
    return authenticatedFetch("/api/user/usage");
  },

  // Billing
  async createCheckoutSession(priceId: string) {
    const { authenticatedFetch } = useAuthenticatedFetch();
    return authenticatedFetch("/api/billing/create-checkout-session", {
      method: "POST",
      body: JSON.stringify({ priceId }),
    });
  },

  async createPortalSession() {
    const { authenticatedFetch } = useAuthenticatedFetch();
    return authenticatedFetch("/api/billing/create-portal-session", {
      method: "POST",
    });
  },
};

// React Query hooks for data fetching (optional but recommended)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useEpisodes = () => {
  return useQuery({
    queryKey: ["episodes"],
    queryFn: apiService.getEpisodes,
  });
};

export const useEpisode = (id: string) => {
  return useQuery({
    queryKey: ["episode", id],
    queryFn: () => apiService.getEpisode(id),
    enabled: !!id,
  });
};

export const useCreateEpisode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiService.createEpisode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
    },
  });
};

export const useUserSubscription = () => {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: apiService.getSubscription,
  });
};

export const useUserUsage = () => {
  return useQuery({
    queryKey: ["usage"],
    queryFn: apiService.getUsage,
  });
};