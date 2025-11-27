// YouTube video transcription using OpenAI Whisper API
import OpenAI from "openai";

// SECURITY: Removed client-side OpenAI client initialization
// All API calls now go through Supabase Edge Functions
// This function is kept for backward compatibility but is no longer used
const getOpenAIClient = () => {
  throw new Error(
    "Direct OpenAI client access is disabled for security. Please use Supabase Edge Functions instead.",
  );
};

// Check if Supabase is configured (SECURITY: No client-side API keys needed)
export const isOpenAIAvailable = (): boolean => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isAvailable = !!supabaseUrl && !!supabaseAnonKey;
  console.log("Supabase configuration check:", {
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseKey: !!supabaseAnonKey,
    isAvailable,
  });
  return isAvailable;
};

// Extract video ID from YouTube URL
export const extractVideoId = (url: string): string | null => {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Get YouTube video info
export const getYouTubeVideoInfo = async (videoId: string) => {
  try {
    // This is a simplified approach - in production you'd use YouTube Data API
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch video info");
    }
    const data = await response.json();
    return {
      title: data.title,
      author: data.author_name,
      thumbnail: data.thumbnail_url,
    };
  } catch (error) {
    console.error("Failed to get video info:", error);
    return {
      title: `YouTube Video ${videoId}`,
      author: "Unknown",
      thumbnail: null,
    };
  }
};

// Download YouTube audio (this would typically be done on the backend)
export const downloadYouTubeAudio = async (videoId: string): Promise<Blob> => {
  // Note: This is a placeholder. In a real implementation, you would:
  // 1. Use a backend service to download the audio using youtube-dl or similar
  // 2. Convert to appropriate format for Whisper API
  // 3. Return the audio blob

  // For now, we'll simulate this process
  throw new Error(
    "YouTube audio download must be implemented on the backend for security and CORS reasons. Please use the backend API endpoint.",
  );
};

// Transcribe audio using Supabase Edge Function (SECURITY: No client-side API keys)
export const transcribeAudioWithWhisper = async (
  audioBlob: Blob,
  filename: string = "audio.mp3",
): Promise<string> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      "Supabase configuration missing. Please check your environment variables.",
    );
  }

  try {
    console.log("Starting Whisper transcription for:", filename);
    console.log("Audio blob size:", audioBlob.size, "bytes");
    console.log("Audio blob type:", audioBlob.type);

    // Validate audio file size (Whisper API has a 25MB limit)
    if (audioBlob.size > 25 * 1024 * 1024) {
      throw new Error(
        "Audio file is too large. Whisper API supports files up to 25MB.",
      );
    }

    // Convert blob to base64
    const base64Audio = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:audio/...;base64, prefix
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read audio blob'));
      reader.readAsDataURL(audioBlob);
    });

    console.log("Calling Supabase Edge Function for transcription:", {
      filename,
      size: audioBlob.size,
      type: audioBlob.type,
    });

    // Call Supabase Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/audio-transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        audioFile: base64Audio,
        fileName: filename,
        fileSize: audioBlob.size,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Transcription failed: ${response.statusText}`;
      
      if (response.status === 401) {
        throw new Error("Authentication failed. Please check your configuration.");
      }
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (response.status === 413) {
        throw new Error("Audio file is too large for Whisper API (max 25MB).");
      }
      throw new Error(`Transcription failed: ${errorMessage}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.transcript || result.transcript.trim().length === 0) {
      throw new Error(result.error || "No transcription text received");
    }

    console.log("Whisper transcription completed successfully");
    console.log("Transcription length:", result.transcript.length);
    console.log(
      "Transcription preview:",
      result.transcript.substring(0, 200) + "...",
    );

    return result.transcript.trim();
  } catch (error) {
    console.error("Transcription error details:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to transcribe audio");
  }
};

// Main function to transcribe YouTube video
export const transcribeYouTubeVideo = async (
  youtubeUrl: string,
  onProgress?: (progress: number, status: string) => void,
): Promise<{
  transcript: string;
  videoInfo: any;
}> => {
  try {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    onProgress?.(10, "Getting video information...");
    const videoInfo = await getYouTubeVideoInfo(videoId);

    onProgress?.(20, "Preparing audio download...");

    // In a real implementation, you would call your backend API here
    // For now, we'll provide instructions for the user
    throw new Error(`
To enable real YouTube transcription, you need to implement a backend service that:

1. Downloads YouTube audio using youtube-dl or yt-dlp
2. Converts audio to a format supported by Whisper API
3. Calls OpenAI Whisper API for transcription
4. Returns the transcript

Backend implementation example:
- Use 'youtube-dl' or 'yt-dlp' to extract audio
- Use 'ffmpeg' to convert to mp3/wav format
- Upload to OpenAI Whisper API
- Return transcript to frontend

For now, the app will use a detailed mock transcript based on the video: ${videoInfo.title}
    `);
  } catch (error) {
    console.error("YouTube transcription failed:", error);
    throw error;
  }
};

// Alternative: Use YouTube's auto-generated captions (if available)
export const extractYouTubeAutoCaption = async (
  youtubeUrl: string,
): Promise<string> => {
  try {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    // This approach tries to extract auto-generated captions
    // Note: This may not work due to CORS and YouTube's anti-scraping measures
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();

    // Look for captions data in the page
    const captionsRegex = /"captions":(\{.*?\})/;
    const match = html.match(captionsRegex);

    if (match) {
      try {
        const captions = JSON.parse(match[1]);
        const tracks = captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (tracks && tracks.length > 0) {
          // Get the first available caption track
          const captionUrl = tracks[0].baseUrl;
          const captionResponse = await fetch(captionUrl);
          const captionXml = await captionResponse.text();

          // Parse XML and extract text
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(captionXml, "text/xml");
          const textElements = xmlDoc.getElementsByTagName("text");

          let transcript = "";
          for (let i = 0; i < textElements.length; i++) {
            const text = textElements[i].textContent || "";
            const cleanText = text
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
            transcript += cleanText + " ";
          }

          if (transcript.trim()) {
            return transcript.trim();
          }
        }
      } catch (parseError) {
        console.error("Failed to parse captions:", parseError);
      }
    }

    throw new Error("No auto-generated captions found for this video");
  } catch (error) {
    console.error("Failed to extract auto captions:", error);
    throw error;
  }
};
